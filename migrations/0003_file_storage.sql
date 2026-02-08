-- Add file_key column to materi for R2 storage
ALTER TABLE materi ADD COLUMN file_key TEXT;

-- Create files table for tracking all uploaded files
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    original_filename TEXT NOT NULL,
    content_type TEXT,
    size INTEGER,
    uploaded_by INTEGER NOT NULL,
    entity_type TEXT, -- 'materi', 'surat', 'profile', etc.
    entity_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_key ON files(key);
CREATE INDEX IF NOT EXISTS idx_files_user ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);
