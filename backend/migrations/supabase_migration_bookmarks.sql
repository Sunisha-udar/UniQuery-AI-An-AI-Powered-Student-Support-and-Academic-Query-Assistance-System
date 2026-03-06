-- Migration: Create Bookmarks table
-- This table stores user's bookmarked/favorite queries and answers

CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    message_id TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    citations JSONB,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure a message can only be bookmarked once per user
    CONSTRAINT unique_user_message UNIQUE (user_id, message_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_session_id ON bookmarks(session_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN(tags);

-- Full-text search index on question, answer, and notes
CREATE INDEX IF NOT EXISTS idx_bookmarks_search ON bookmarks USING gin(
    to_tsvector('english', question || ' ' || answer || ' ' || COALESCE(notes, ''))
);

-- Add comments for documentation
COMMENT ON TABLE bookmarks IS 'Stores user bookmarked/favorite queries and answers for quick access';
COMMENT ON COLUMN bookmarks.id IS 'Unique identifier for the bookmark';
COMMENT ON COLUMN bookmarks.user_id IS 'User who created the bookmark';
COMMENT ON COLUMN bookmarks.session_id IS 'Chat session ID where the message was from';
COMMENT ON COLUMN bookmarks.message_id IS 'Message ID that was bookmarked';
COMMENT ON COLUMN bookmarks.question IS 'The question text';
COMMENT ON COLUMN bookmarks.answer IS 'The answer text';
COMMENT ON COLUMN bookmarks.citations IS 'Citations/sources for the answer';
COMMENT ON COLUMN bookmarks.notes IS 'User notes about this bookmark';
COMMENT ON COLUMN bookmarks.tags IS 'User-defined tags for organization';
COMMENT ON COLUMN bookmarks.created_at IS 'Timestamp when the bookmark was created';

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bookmarks
CREATE POLICY "Users can view own bookmarks"
    ON bookmarks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own bookmarks
CREATE POLICY "Users can create own bookmarks"
    ON bookmarks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own bookmarks
CREATE POLICY "Users can update own bookmarks"
    ON bookmarks
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
    ON bookmarks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to get bookmark count for a user
CREATE OR REPLACE FUNCTION get_bookmark_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    bookmark_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bookmark_count
    FROM bookmarks
    WHERE user_id = p_user_id;
    
    RETURN bookmark_count;
END;
$$;

COMMENT ON FUNCTION get_bookmark_count IS 'Returns the total number of bookmarks for a user';

-- Function to get all unique tags for a user
CREATE OR REPLACE FUNCTION get_user_bookmark_tags(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    all_tags TEXT[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT tag)
    INTO all_tags
    FROM bookmarks, UNNEST(tags) AS tag
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(all_tags, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION get_user_bookmark_tags IS 'Returns all unique tags used by a user in their bookmarks';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_bookmark_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_bookmark_tags(UUID) TO authenticated;
