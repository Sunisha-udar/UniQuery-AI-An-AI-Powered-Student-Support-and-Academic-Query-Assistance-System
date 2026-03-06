-- Behavior moderation foundation
-- Creates moderation state, event logs, support tickets, and helper RPC functions.

CREATE TABLE IF NOT EXISTS user_moderation_state (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    warning_count INTEGER NOT NULL DEFAULT 0 CHECK (warning_count >= 0),
    total_warning_count INTEGER NOT NULL DEFAULT 0 CHECK (total_warning_count >= 0),
    suspension_count INTEGER NOT NULL DEFAULT 0 CHECK (suspension_count >= 0),
    last_warning_at TIMESTAMPTZ,
    last_suspended_at TIMESTAMPTZ,
    last_reactivated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (
        event_type IN (
            'warning_issued',
            'auto_suspended',
            'reactivated',
            'manual_suspended',
            'manual_unsuspended'
        )
    ),
    question TEXT,
    normalized_question TEXT,
    detector TEXT,
    reason_code TEXT,
    reason_detail TEXT,
    confidence NUMERIC(4,3),
    warning_count_after INTEGER,
    suspension_count_after INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'rejected')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_events_user_id_created_at
    ON moderation_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_events_event_type
    ON moderation_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created_at
    ON support_tickets(status, created_at DESC);

ALTER TABLE user_moderation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own moderation state" ON user_moderation_state;
CREATE POLICY "Users can view own moderation state"
    ON user_moderation_state
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all moderation state" ON user_moderation_state;
CREATE POLICY "Admins can view all moderation state"
    ON user_moderation_state
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view own moderation events" ON moderation_events;
CREATE POLICY "Users can view own moderation events"
    ON moderation_events
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all moderation events" ON moderation_events;
CREATE POLICY "Admins can view all moderation events"
    ON moderation_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view own support tickets" ON support_tickets;
CREATE POLICY "Users can view own support tickets"
    ON support_tickets
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own support tickets" ON support_tickets;
CREATE POLICY "Users can create own support tickets"
    ON support_tickets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all support tickets" ON support_tickets;
CREATE POLICY "Admins can view all support tickets"
    ON support_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admins can update support tickets" ON support_tickets;
CREATE POLICY "Admins can update support tickets"
    ON support_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION apply_behavior_warning(
    p_user_id UUID,
    p_question TEXT,
    p_normalized_text TEXT,
    p_detector TEXT,
    p_reason_code TEXT,
    p_reason_detail TEXT,
    p_confidence NUMERIC
)
RETURNS TABLE (
    warning_count INTEGER,
    remaining_warnings INTEGER,
    is_suspended BOOLEAN,
    suspension_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_warning_count INTEGER;
    v_suspension_count INTEGER;
    v_is_suspended BOOLEAN;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Profile not found for moderation target';
    END IF;

    INSERT INTO user_moderation_state (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE user_moderation_state AS ums
    SET warning_count = ums.warning_count + 1,
        total_warning_count = ums.total_warning_count + 1,
        last_warning_at = NOW(),
        updated_at = NOW()
    WHERE ums.user_id = p_user_id
    RETURNING ums.warning_count, ums.suspension_count
    INTO v_warning_count, v_suspension_count;

    INSERT INTO moderation_events (
        user_id,
        event_type,
        question,
        normalized_question,
        detector,
        reason_code,
        reason_detail,
        confidence,
        warning_count_after,
        suspension_count_after,
        metadata
    )
    VALUES (
        p_user_id,
        'warning_issued',
        p_question,
        p_normalized_text,
        p_detector,
        p_reason_code,
        p_reason_detail,
        p_confidence,
        v_warning_count,
        v_suspension_count,
        jsonb_build_object('source', 'query_router')
    );

    v_is_suspended := FALSE;

    IF v_warning_count >= 5 THEN
        UPDATE profiles
        SET suspended = TRUE,
            updated_at = NOW()
        WHERE id = p_user_id;

        UPDATE user_moderation_state AS ums
        SET suspension_count = ums.suspension_count + 1,
            last_suspended_at = NOW(),
            updated_at = NOW()
        WHERE ums.user_id = p_user_id
        RETURNING ums.suspension_count
        INTO v_suspension_count;

        INSERT INTO moderation_events (
            user_id,
            event_type,
            question,
            normalized_question,
            detector,
            reason_code,
            reason_detail,
            confidence,
            warning_count_after,
            suspension_count_after,
            metadata
        )
        VALUES (
            p_user_id,
            'auto_suspended',
            p_question,
            p_normalized_text,
            p_detector,
            'five_warning_limit',
            'Automatic suspension after 5 confirmed informal messages',
            p_confidence,
            v_warning_count,
            v_suspension_count,
            jsonb_build_object('source', 'query_router')
        );

        v_is_suspended := TRUE;
    END IF;

    RETURN QUERY
    SELECT
        v_warning_count AS warning_count,
        GREATEST(0, 5 - v_warning_count) AS remaining_warnings,
        v_is_suspended AS is_suspended,
        v_suspension_count AS suspension_count;
END;
$$;

CREATE OR REPLACE FUNCTION reactivate_user_account(
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    warning_count INTEGER,
    is_suspended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can reactivate accounts';
    END IF;

    UPDATE profiles
    SET suspended = FALSE,
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO user_moderation_state (user_id, warning_count, last_reactivated_at, updated_at)
    VALUES (p_user_id, 0, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET warning_count = 0,
        last_reactivated_at = NOW(),
        updated_at = NOW();

    INSERT INTO moderation_events (
        user_id,
        event_type,
        reason_code,
        reason_detail,
        metadata
    )
    VALUES (
        p_user_id,
        'reactivated',
        'admin_reactivated',
        COALESCE(p_reason, 'Admin reactivated account and reset warning cycle'),
        jsonb_build_object('admin_user_id', auth.uid())
    );

    RETURN QUERY
    SELECT 0 AS warning_count, FALSE AS is_suspended;
END;
$$;

REVOKE ALL ON FUNCTION apply_behavior_warning(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION apply_behavior_warning(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION apply_behavior_warning(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM authenticated;
GRANT EXECUTE ON FUNCTION apply_behavior_warning(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION reactivate_user_account(UUID, TEXT) TO authenticated;

COMMENT ON TABLE user_moderation_state IS 'Tracks the active warning cycle and suspension history for each user.';
COMMENT ON TABLE moderation_events IS 'Immutable moderation audit log for warnings, suspensions, and reactivations.';
COMMENT ON TABLE support_tickets IS 'Appeals and contact-support tickets submitted by suspended users.';
