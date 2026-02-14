-- Migration: Add Teacher Super App Features (RPM, Kisi-Kisi, Slide)

-- 1. RPP History
CREATE TABLE IF NOT EXISTS rpp_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mata_pelajaran TEXT NOT NULL,
    topik TEXT NOT NULL,
    jenjang_kelas TEXT NOT NULL,
    semester TEXT NOT NULL,
    alokasi_waktu TEXT,
    strategi TEXT DEFAULT 'Deep Learning',
    content_json TEXT NOT NULL, -- Stores the full generated RPP JSON
    input_data_json TEXT,       -- Stores the form input used to generate
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rpp_user ON rpp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rpp_created ON rpp_history(created_at);

-- 2. Kisi-Kisi Projects
CREATE TABLE IF NOT EXISTS kisi_projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade_level TEXT,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kisi_projects_user ON kisi_projects(user_id);

-- 3. Kisi-Kisi Uploads (Files uploaded to a project)
CREATE TABLE IF NOT EXISTS kisi_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_data BLOB, -- Optional: Store file content if needed, or use R2/Storage
    file_size INTEGER,
    status TEXT DEFAULT 'processing', -- processing, complete, error
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES kisi_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kisi_uploads_project ON kisi_uploads(project_id);

-- 4. Kisi-Kisi Questions (Extracted from uploads)
CREATE TABLE IF NOT EXISTS kisi_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id INTEGER NOT NULL,
    number INTEGER,
    type TEXT, -- PILIHAN_GANDA, ESSAY, etc.
    stem TEXT, -- The question text
    options_json TEXT, -- JSON array of options
    answer_key TEXT,
    answer_source TEXT,
    material_ai TEXT, -- AI classified material
    indicator_ai TEXT, -- AI generated indicator
    level_ai TEXT, -- L1, L2, L3
    confidence REAL, -- AI confidence score
    status TEXT DEFAULT 'valid',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES kisi_uploads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kisi_questions_upload ON kisi_questions(upload_id);

-- 5. Kisi-Kisi Blueprints (Generated Matrix)
CREATE TABLE IF NOT EXISTS kisi_blueprints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    metadata TEXT, -- JSON metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES kisi_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kisi_blueprints_project ON kisi_blueprints(project_id);

-- 6. Kisi-Kisi Blueprint Rows (Detail rows)
CREATE TABLE IF NOT EXISTS kisi_blueprint_rows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blueprint_id INTEGER NOT NULL,
    sort_order INTEGER,
    material TEXT,
    indicator TEXT,
    question_type TEXT,
    levels TEXT,
    question_numbers TEXT,
    answers_json TEXT,
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blueprint_id) REFERENCES kisi_blueprints(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kisi_rows_blueprint ON kisi_blueprint_rows(blueprint_id);

-- 7. Presentation History
CREATE TABLE IF NOT EXISTS presentation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic TEXT NOT NULL,
    audience TEXT,
    slide_count INTEGER,
    model_type TEXT DEFAULT 'gemini',
    content_json TEXT NOT NULL, -- Stores the slide content structure
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_present_user ON presentation_history(user_id);
