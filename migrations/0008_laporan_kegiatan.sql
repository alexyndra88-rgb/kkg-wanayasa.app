-- Migration for Laporan KKG (KKG Report) Feature

CREATE TABLE IF NOT EXISTS laporan_kegiatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  program_kerja_id INTEGER, -- Optional link to Proker
  judul_laporan TEXT NOT NULL,
  periode TEXT, -- e.g., "Februari 2026" or "Semester Genap 2025/2026"
  
  -- BAB I: Pendahuluan
  pendahuluan_latar_belakang TEXT,
  pendahuluan_tujuan TEXT,
  pendahuluan_manfaat TEXT,

  -- BAB II: Pelaksanaan Kegiatan
  pelaksanaan_waktu_tempat TEXT,
  pelaksanaan_materi TEXT,
  pelaksanaan_peserta TEXT, -- Summary of attendees/narasumber

  -- BAB III: Hasil Kegiatan
  hasil_uraian TEXT,
  hasil_tindak_lanjut TEXT,
  hasil_dampak TEXT,

  -- BAB IV: Penutup
  penutup_simpulan TEXT,
  penutup_saran TEXT,

  -- Lampiran (Stored as JSON strings)
  lampiran_foto TEXT, -- JSON array of file URLs: ["/uploads/img1.jpg", "/uploads/img2.jpg"]
  lampiran_daftar_hadir TEXT, -- URL to uploaded file: "/uploads/daftar_hadir.pdf"

  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','final')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (program_kerja_id) REFERENCES program_kerja(id)
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_laporan_user ON laporan_kegiatan(user_id);
CREATE INDEX IF NOT EXISTS idx_laporan_proker ON laporan_kegiatan(program_kerja_id);
