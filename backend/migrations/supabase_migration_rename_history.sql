-- Migration: Create rename_history table
-- This table tracks all document rename operations for undo/redo functionality

CREATE TABLE IF NOT EXISTS rename_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id TEXT NOT NULL,
    old_title TEXT NOT NULL,
    new_title TEXT NOT NULL,
    renamed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    renamed_by TEXT NOT NULL DEFAULT 'admin',
    undone BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign key to documents table (optional, for referential integrity)
    CONSTRAINT fk_document FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rename_history_doc_id ON rename_history(doc_id);
CREATE INDEX IF NOT EXISTS idx_rename_history_renamed_at ON rename_history(renamed_at DESC);
CREATE INDEX IF NOT EXISTS idx_rename_history_undone ON rename_history(undone) WHERE undone = FALSE;

-- Add comments for documentation
COMMENT ON TABLE rename_history IS 'Tracks document rename operations for undo/redo functionality';
COMMENT ON COLUMN rename_history.id IS 'Unique identifier for the history entry';
COMMENT ON COLUMN rename_history.doc_id IS 'Reference to the document that was renamed';
COMMENT ON COLUMN rename_history.old_title IS 'Previous title before rename';
COMMENT ON COLUMN rename_history.new_title IS 'New title after rename';
COMMENT ON COLUMN rename_history.renamed_at IS 'Timestamp when the rename occurred';
COMMENT ON COLUMN rename_history.renamed_by IS 'User who performed the rename';
COMMENT ON COLUMN rename_history.undone IS 'Flag indicating if this rename was undone';
