-- =============================================
-- Migration: Add Sekolah (Schools) Table
-- Portal Digital KKG Gugus 3 Wanayasa
-- =============================================

-- Daftar Sekolah Anggota KKG
CREATE TABLE IF NOT EXISTS sekolah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  npsn TEXT UNIQUE, -- Nomor Pokok Sekolah Nasional
  tipe TEXT DEFAULT 'negeri' CHECK(tipe IN ('negeri', 'swasta')),
  alamat TEXT,
  kepala_sekolah TEXT,
  jumlah_guru INTEGER,
  is_sekretariat INTEGER DEFAULT 0, -- Apakah menjadi sekretariat KKG
  is_sekolah_penggerak INTEGER DEFAULT 0, -- Apakah Sekolah Penggerak
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index untuk pencarian
CREATE INDEX IF NOT EXISTS idx_sekolah_nama ON sekolah(nama);
CREATE INDEX IF NOT EXISTS idx_sekolah_tipe ON sekolah(tipe);

-- Insert data awal sekolah KKG Gugus 3 Wanayasa
INSERT OR IGNORE INTO sekolah (nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan) VALUES
  ('SDN 2 Nangerang', 'negeri', 1, 0, 'Sekretariat KKG Gugus 3'),
  ('SDN 1 Nangerang', 'negeri', 0, 0, NULL),
  ('SDN Nagrog', 'negeri', 0, 0, NULL),
  ('SDN Raharja', 'negeri', 0, 1, 'Sekolah Penggerak'),
  ('SDN 1 Cibuntu', 'negeri', 0, 0, NULL),
  ('SDN 2 Cibuntu', 'negeri', 0, 0, NULL),
  ('SDN Sumurugul', 'negeri', 0, 0, NULL),
  ('SDN Sakambang', 'negeri', 0, 0, NULL),
  ('SDIT Al-Qalam', 'swasta', 0, 0, 'Sekolah Swasta');
