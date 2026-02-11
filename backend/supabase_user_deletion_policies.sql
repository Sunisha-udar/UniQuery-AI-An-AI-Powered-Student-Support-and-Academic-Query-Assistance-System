-- =====================================================
-- User Deletion Policies and Cascade Setup
-- =====================================================
-- This migration enables users to delete their own accounts
-- and admins to delete any user account, with proper cascade
-- deletion of related data.

-- =====================================================
-- 1. Enable Row Level Security (if not already enabled)
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. Create Deletion Policies for Profiles
-- =====================================================

-- Policy: Users can delete their own account
CREATE POLICY "Users can delete own account"
ON profiles FOR DELETE
USING (auth.uid() = id);

-- Policy: Admins can delete any account
CREATE POLICY "Admins can delete any account"
ON profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- 3. Setup CASCADE Deletes for Related Tables
-- =====================================================

-- User Queries: Delete all queries when user is deleted
ALTER TABLE IF EXISTS user_queries 
  DROP CONSTRAINT IF EXISTS user_queries_user_id_fkey;

ALTER TABLE IF EXISTS user_queries 
  ADD CONSTRAINT user_queries_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Chat Sessions: Delete all chat sessions when user is deleted
ALTER TABLE IF EXISTS chat_sessions 
  DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;

ALTER TABLE IF EXISTS chat_sessions 
  ADD CONSTRAINT chat_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Documents: Option 1 - Delete documents when uploader is deleted
-- (Uncomment if you want documents to be deleted)
-- ALTER TABLE IF EXISTS documents 
--   DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;
-- 
-- ALTER TABLE IF EXISTS documents 
--   ADD CONSTRAINT documents_uploaded_by_fkey 
--   FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Documents: Option 2 - Set uploaded_by to NULL when user is deleted
-- (Keep documents but remove user reference)
ALTER TABLE IF EXISTS documents 
  DROP CONSTRAINT IF EXISTS documents_uploaded_by_fkey;

ALTER TABLE IF EXISTS documents 
  ADD CONSTRAINT documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Rename History: Delete rename history when user is deleted
ALTER TABLE IF EXISTS rename_history 
  DROP CONSTRAINT IF EXISTS rename_history_renamed_by_fkey;

ALTER TABLE IF EXISTS rename_history 
  ADD CONSTRAINT rename_history_renamed_by_fkey 
  FOREIGN KEY (renamed_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- =====================================================
-- 4. Create Function to Prevent Last Admin Deletion
-- =====================================================

CREATE OR REPLACE FUNCTION prevent_last_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user being deleted is an admin
  IF OLD.role = 'admin' THEN
    -- Count remaining admins (excluding the one being deleted)
    IF (SELECT COUNT(*) FROM profiles WHERE role = 'admin' AND id != OLD.id) < 1 THEN
      RAISE EXCEPTION 'Cannot delete the last admin account';
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent last admin deletion
DROP TRIGGER IF EXISTS prevent_last_admin_deletion_trigger ON profiles;

CREATE TRIGGER prevent_last_admin_deletion_trigger
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_last_admin_deletion();

-- =====================================================
-- 5. Create Audit Log Table (Optional but Recommended)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_deletion_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id UUID NOT NULL,
  deleted_user_email TEXT NOT NULL,
  deleted_user_role TEXT NOT NULL,
  deleted_by UUID,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deletion_type TEXT CHECK (deletion_type IN ('self', 'admin')) NOT NULL,
  FOREIGN KEY (deleted_by) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Enable RLS on audit table
ALTER TABLE user_deletion_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view deletion audit logs"
ON user_deletion_audit FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to log deletions
CREATE OR REPLACE FUNCTION log_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_deletion_audit (
    deleted_user_id,
    deleted_user_email,
    deleted_user_role,
    deleted_by,
    deletion_type
  ) VALUES (
    OLD.id,
    OLD.email,
    OLD.role,
    auth.uid(),
    CASE 
      WHEN OLD.id = auth.uid() THEN 'self'
      ELSE 'admin'
    END
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log deletions
DROP TRIGGER IF EXISTS log_user_deletion_trigger ON profiles;

CREATE TRIGGER log_user_deletion_trigger
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_user_deletion();

-- =====================================================
-- 6. Comments for Documentation
-- =====================================================

COMMENT ON POLICY "Users can delete own account" ON profiles IS 
  'Allows authenticated users to delete their own account';

COMMENT ON POLICY "Admins can delete any account" ON profiles IS 
  'Allows admin users to delete any user account';

COMMENT ON TABLE user_deletion_audit IS 
  'Audit log for tracking user account deletions';

COMMENT ON FUNCTION prevent_last_admin_deletion() IS 
  'Prevents deletion of the last admin account in the system';
