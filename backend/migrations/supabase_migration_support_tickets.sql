-- Migration: Create support tickets table
-- This table stores contact-support requests and admin resolution notes.

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

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id_created_at
    ON support_tickets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_created_at
    ON support_tickets(status, created_at DESC);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

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
            SELECT 1
            FROM profiles
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
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE support_tickets IS 'Stores contact-support requests and appeal tickets submitted by users.';
COMMENT ON COLUMN support_tickets.user_id IS 'User who submitted the support request.';
COMMENT ON COLUMN support_tickets.subject IS 'Short summary of the support request.';
COMMENT ON COLUMN support_tickets.message IS 'Detailed message submitted by the user.';
COMMENT ON COLUMN support_tickets.status IS 'Admin workflow state for the request.';
COMMENT ON COLUMN support_tickets.admin_notes IS 'Internal admin notes for review and resolution.';
COMMENT ON COLUMN support_tickets.resolved_by IS 'Admin profile that resolved or rejected the ticket.';
COMMENT ON COLUMN support_tickets.resolved_at IS 'Timestamp when the ticket was resolved or rejected.';
