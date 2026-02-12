-- Row Level Security (RLS) for FAQs Table
-- This file contains all RLS policies for the faqs table

-- Enable Row Level Security on FAQs table
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- READ POLICIES
-- ============================================================================

-- Policy 1: Allow everyone (including anonymous users) to read FAQs
-- This ensures students can view FAQs without being logged in
CREATE POLICY "FAQs are publicly readable"
  ON faqs
  FOR SELECT
  USING (true);

-- ============================================================================
-- WRITE POLICIES (Admin Only)
-- ============================================================================

-- Policy 2: Only admins can insert FAQs
CREATE POLICY "Only admins can insert FAQs"
  ON faqs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy 3: Only admins can update FAQs
CREATE POLICY "Only admins can update FAQs"
  ON faqs
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

-- Policy 4: Only admins can delete FAQs
CREATE POLICY "Only admins can delete FAQs"
  ON faqs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- SECURE FUNCTION FOR VIEW COUNT
-- ============================================================================

-- Policy 5: Allow anonymous users to increment view count
-- This is a special case - we handle view count updates via a secure function
-- The function bypasses RLS using SECURITY DEFINER

CREATE OR REPLACE FUNCTION increment_faq_view_count(faq_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE faqs
  SET view_count = view_count + 1
  WHERE id = faq_id;
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION increment_faq_view_count(UUID) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION increment_faq_view_count IS 'Safely increments FAQ view count without requiring admin privileges';

-- ============================================================================
-- POLICY SUMMARY
-- ============================================================================

/*
RLS Policies for FAQs Table:

1. READ (SELECT):
   - ✅ Everyone (including anonymous users) can read all FAQs
   - This allows students to browse FAQs without logging in

2. CREATE (INSERT):
   - ✅ Only users with role='admin' can create new FAQs
   - Prevents unauthorized FAQ creation

3. UPDATE:
   - ✅ Only users with role='admin' can update FAQs
   - Protects FAQ content from unauthorized modifications
   - Exception: view_count is updated via secure function

4. DELETE:
   - ✅ Only users with role='admin' can delete FAQs
   - Prevents accidental or malicious FAQ deletion

5. VIEW COUNT:
   - ✅ Special secure function allows anyone to increment view count
   - Uses SECURITY DEFINER to bypass RLS for this specific operation
   - Ensures accurate tracking without requiring authentication

TESTING:
--------
-- Test as anonymous user (should work)
SELECT * FROM faqs;

-- Test as student (should work)
SELECT * FROM faqs;

-- Test as admin (should work for all operations)
INSERT INTO faqs (question, answer, category) VALUES ('Test?', 'Test answer', 'Test');
UPDATE faqs SET answer = 'Updated' WHERE question = 'Test?';
DELETE FROM faqs WHERE question = 'Test?';

-- Test view count increment (should work for everyone)
SELECT increment_faq_view_count('some-faq-id');
*/
