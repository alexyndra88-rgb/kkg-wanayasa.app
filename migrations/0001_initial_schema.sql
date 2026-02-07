-- =============================================
-- Portal Digital KKG Gugus 3 Wanayasa
-- Database Schema
-- =============================================

-- Users & Auth
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  nip TEXT,
  nik TEXT,
  mata_pelajaran TEXT,
  sekolah TEXT,
  no_hp TEXT,
  alamat TEXT,
  foto_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Settings (for API keys, site config)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Surat Undangan
CREATE TABLE IF NOT EXISTS surat_undangan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  nomor_surat TEXT,
  jenis_kegiatan TEXT NOT NULL,
  tanggal_kegiatan TEXT NOT NULL,
  waktu_kegiatan TEXT NOT NULL,
  tempat_kegiatan TEXT NOT NULL,
  agenda TEXT NOT NULL,
  peserta TEXT, -- JSON array
  penutup TEXT,
  penanggung_jawab TEXT,
  isi_surat TEXT, -- generated content
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','final')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Program Kerja
CREATE TABLE IF NOT EXISTS program_kerja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tahun_ajaran TEXT NOT NULL,
  visi TEXT,
  misi TEXT,
  kegiatan TEXT, -- JSON array of activities
  analisis_kebutuhan TEXT,
  isi_dokumen TEXT, -- generated content
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','final')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Kegiatan (for absensi)
CREATE TABLE IF NOT EXISTS kegiatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama_kegiatan TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  waktu_mulai TEXT,
  waktu_selesai TEXT,
  tempat TEXT,
  deskripsi TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Absensi
CREATE TABLE IF NOT EXISTS absensi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kegiatan_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  waktu_checkin DATETIME DEFAULT CURRENT_TIMESTAMP,
  keterangan TEXT,
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(kegiatan_id, user_id)
);

-- Repository Materi
CREATE TABLE IF NOT EXISTS materi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  kategori TEXT, -- mata pelajaran
  jenjang TEXT, -- SD, SMP, SMA
  jenis TEXT, -- RPP, Modul, Video, dll
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  uploaded_by INTEGER NOT NULL,
  download_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Pengumuman
CREATE TABLE IF NOT EXISTS pengumuman (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  kategori TEXT DEFAULT 'umum',
  is_pinned INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Forum
CREATE TABLE IF NOT EXISTS forum_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  kategori TEXT,
  user_id INTEGER NOT NULL,
  is_pinned INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  isi TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_surat_user ON surat_undangan(user_id);
CREATE INDEX IF NOT EXISTS idx_proker_user ON program_kerja(user_id);
CREATE INDEX IF NOT EXISTS idx_absensi_kegiatan ON absensi(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_absensi_user ON absensi(user_id);
CREATE INDEX IF NOT EXISTS idx_materi_kategori ON materi(kategori);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_pengumuman_pinned ON pengumuman(is_pinned);
