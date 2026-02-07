-- Seed data for KKG Gugus 3 Wanayasa
-- Default admin password: admin123 (hashed with simple SHA-256 for demo)

INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
VALUES 
  (1, 'Admin KKG Gugus 3', 'admin@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', '198501012010011001', 'SDN 1 Wanayasa', 'Guru Kelas', '081234567890'),
  (2, 'Siti Nurhaliza', 'siti@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198602022011012002', 'SDN 2 Wanayasa', 'Matematika', '081234567891'),
  (3, 'Budi Santoso', 'budi@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198703032012011003', 'SDN 3 Wanayasa', 'IPA', '081234567892'),
  (4, 'Dewi Lestari', 'dewi@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198804042013012004', 'SDN 1 Wanayasa', 'Bahasa Indonesia', '081234567893'),
  (5, 'Ahmad Fauzi', 'ahmad@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198905052014011005', 'SDN 4 Wanayasa', 'IPS', '081234567894');

INSERT OR IGNORE INTO pengumuman (id, judul, isi, kategori, is_pinned, created_by)
VALUES
  (1, 'Selamat Datang di Portal Digital KKG Gugus 3 Wanayasa', 'Assalamualaikum Wr. Wb.\n\nDengan penuh rasa syukur, kami meluncurkan Portal Digital KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta. Portal ini dirancang untuk memudahkan koordinasi, komunikasi, dan kolaborasi antar guru di lingkungan KKG Gugus 3.\n\nSemoga portal ini bermanfaat bagi seluruh anggota.\n\nWassalamualaikum Wr. Wb.', 'umum', 1, 1),
  (2, 'Jadwal Rapat Rutin KKG Bulan Februari 2026', 'Diberitahukan kepada seluruh anggota KKG Gugus 3 Wanayasa bahwa rapat rutin bulanan akan dilaksanakan pada:\n\nHari/Tanggal: Sabtu, 14 Februari 2026\nWaktu: 09.00 - 12.00 WIB\nTempat: SDN 1 Wanayasa\nAgenda: Evaluasi Program Semester Ganjil dan Penyusunan Program Semester Genap\n\nDimohon kehadiran seluruh anggota tepat waktu.', 'jadwal', 1, 1),
  (3, 'Workshop Kurikulum Merdeka Belajar', 'KKG Gugus 3 Wanayasa akan menyelenggarakan Workshop Kurikulum Merdeka Belajar bekerja sama dengan Dinas Pendidikan Kabupaten Purwakarta. Kegiatan ini wajib diikuti seluruh guru anggota KKG.', 'kegiatan', 0, 1);

INSERT OR IGNORE INTO kegiatan (id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi, created_by)
VALUES
  (1, 'Rapat Rutin KKG Februari 2026', '2026-02-14', '09:00', '12:00', 'SDN 1 Wanayasa', 'Evaluasi Program Semester Ganjil dan Penyusunan Program Semester Genap', 1),
  (2, 'Workshop Kurikulum Merdeka', '2026-02-28', '08:00', '16:00', 'SDN 1 Wanayasa', 'Workshop implementasi Kurikulum Merdeka Belajar', 1);

INSERT OR IGNORE INTO forum_threads (id, judul, isi, kategori, user_id, reply_count)
VALUES
  (1, 'Sharing Best Practice: Pembelajaran Diferensiasi di SD', 'Assalamualaikum rekan-rekan guru.\n\nSaya ingin berbagi pengalaman tentang penerapan pembelajaran diferensiasi di kelas saya. Bagaimana pengalaman rekan-rekan?\n\nMari kita diskusikan bersama.', 'best-practice', 2, 1),
  (2, 'Tips Membuat RPP Kurikulum Merdeka', 'Bagi rekan guru yang masih bingung menyusun RPP/Modul Ajar sesuai Kurikulum Merdeka, mari kita diskusikan di thread ini.', 'kurikulum', 3, 0);

INSERT OR IGNORE INTO forum_replies (id, thread_id, user_id, isi)
VALUES
  (1, 1, 3, 'Waalaikumsalam Bu Siti.\n\nSaya sudah mencoba pembelajaran diferensiasi dengan membagi siswa berdasarkan gaya belajar. Hasilnya cukup positif, siswa lebih antusias mengikuti pembelajaran.');

INSERT OR IGNORE INTO settings (key, value)
VALUES
  ('mistral_api_key', ''),
  ('nama_ketua', 'Admin KKG Gugus 3'),
  ('nip_ketua', '198501012010011001'),
  ('alamat_sekretariat', 'SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta'),
  ('tahun_ajaran', '2025/2026');
