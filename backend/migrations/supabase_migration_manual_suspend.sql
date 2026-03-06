-- Add manual suspension function that increments suspension count
-- This allows admins to manually suspend users and track suspension history

CREATE OR REPLACE FUNCTION manual_suspend_user(
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    suspension_count INTEGER,
    is_suspended BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_suspension_count INTEGER;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can manually suspend accounts';
    END IF;

    UPDATE profiles
    SET suspended = TRUE,
        updated_at = NOW()
    WHERE id = p_user_id;

    INSERT INTO user_moderation_state (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    UPDATE user_moderation_state
    SET suspension_count = suspension_count + 1,
        last_suspended_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING suspension_count
    INTO v_suspension_count;

    INSERT INTO moderation_events (
        user_id,
        event_type,
        reason_code,
        reason_detail,
        suspension_count_after,
        metadata
    )
    VALUES (
        p_user_id,
        'manual_suspended',
        'admin_manual_suspend',
        COALESCE(p_reason, 'Admin manually suspended account'),
        v_suspension_count,
        jsonb_build_object('admin_user_id', auth.uid())
    );

    RETURN QUERY
    SELECT v_suspension_count AS suspension_count, TRUE AS is_suspended;
END;
$$;

GRANT EXECUTE ON FUNCTION manual_suspend_user(UUID, TEXT) TO authenticated;

COMMENT ON FUNCTION manual_suspend_user IS 'Allows admins to manually suspend users and increment suspension count';
