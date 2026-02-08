-- Migration: Add rating and review system for materi
-- Also add user approval system

-- Materi Reviews Table
CREATE TABLE IF NOT EXISTS materi_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    materi_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    komentar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(materi_id, user_id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_reviews_materi ON materi_reviews(materi_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON materi_reviews(user_id);

-- Add average rating cache to materi table
ALTER TABLE materi ADD COLUMN avg_rating REAL DEFAULT 0;
ALTER TABLE materi ADD COLUMN total_reviews INTEGER DEFAULT 0;
ALTER TABLE materi ADD COLUMN download_count INTEGER DEFAULT 0;

-- User Approval System
ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN approved_at DATETIME;
ALTER TABLE users ADD COLUMN approved_by INTEGER;

-- Create pending users view
CREATE VIEW IF NOT EXISTS v_pending_users AS
SELECT 
    id, nama, email, nip, sekolah, role, created_at
FROM users
WHERE is_approved = 0
ORDER BY created_at DESC;

-- Add trigger to update materi rating cache
CREATE TRIGGER IF NOT EXISTS update_materi_rating_insert
AFTER INSERT ON materi_reviews
BEGIN
    UPDATE materi SET 
        avg_rating = (SELECT AVG(rating) FROM materi_reviews WHERE materi_id = NEW.materi_id),
        total_reviews = (SELECT COUNT(*) FROM materi_reviews WHERE materi_id = NEW.materi_id)
    WHERE id = NEW.materi_id;
END;

CREATE TRIGGER IF NOT EXISTS update_materi_rating_update
AFTER UPDATE ON materi_reviews
BEGIN
    UPDATE materi SET 
        avg_rating = (SELECT AVG(rating) FROM materi_reviews WHERE materi_id = NEW.materi_id),
        total_reviews = (SELECT COUNT(*) FROM materi_reviews WHERE materi_id = NEW.materi_id)
    WHERE id = NEW.materi_id;
END;

CREATE TRIGGER IF NOT EXISTS update_materi_rating_delete
AFTER DELETE ON materi_reviews
BEGIN
    UPDATE materi SET 
        avg_rating = COALESCE((SELECT AVG(rating) FROM materi_reviews WHERE materi_id = OLD.materi_id), 0),
        total_reviews = (SELECT COUNT(*) FROM materi_reviews WHERE materi_id = OLD.materi_id)
    WHERE id = OLD.materi_id;
END;
