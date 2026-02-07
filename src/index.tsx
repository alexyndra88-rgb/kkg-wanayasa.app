import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import suratRoutes from './routes/surat';
import prokerRoutes from './routes/proker';
import absensiRoutes from './routes/absensi';
import guruRoutes from './routes/guru';
import pengumumanRoutes from './routes/pengumuman';
import forumRoutes from './routes/forum';
import materiRoutes from './routes/materi';
import adminRoutes from './routes/admin';
import { renderHTML } from './templates/layout';

type Bindings = { DB: D1Database };

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/surat', suratRoutes);
app.route('/api/proker', prokerRoutes);
app.route('/api/absensi', absensiRoutes);
app.route('/api/guru', guruRoutes);
app.route('/api/pengumuman', pengumumanRoutes);
app.route('/api/forum', forumRoutes);
app.route('/api/materi', materiRoutes);
app.route('/api/admin', adminRoutes);

// DB init endpoint (for first setup)
app.get('/api/init-db', async (c) => {
  try {
    // Read and execute migration
    const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  nip TEXT, nik TEXT, mata_pelajaran TEXT, sekolah TEXT, no_hp TEXT, alamat TEXT, foto_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS surat_undangan (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, nomor_surat TEXT,
  jenis_kegiatan TEXT NOT NULL, tanggal_kegiatan TEXT NOT NULL, waktu_kegiatan TEXT NOT NULL,
  tempat_kegiatan TEXT NOT NULL, agenda TEXT NOT NULL, peserta TEXT, penutup TEXT, 
  penanggung_jawab TEXT, isi_surat TEXT, status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS program_kerja (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, tahun_ajaran TEXT NOT NULL,
  visi TEXT, misi TEXT, kegiatan TEXT, analisis_kebutuhan TEXT, isi_dokumen TEXT, 
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS kegiatan (
  id INTEGER PRIMARY KEY AUTOINCREMENT, nama_kegiatan TEXT NOT NULL, tanggal TEXT NOT NULL,
  waktu_mulai TEXT, waktu_selesai TEXT, tempat TEXT, deskripsi TEXT, created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS absensi (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kegiatan_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  waktu_checkin DATETIME DEFAULT CURRENT_TIMESTAMP, keterangan TEXT,
  FOREIGN KEY (kegiatan_id) REFERENCES kegiatan(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id), UNIQUE(kegiatan_id, user_id)
);
CREATE TABLE IF NOT EXISTS materi (
  id INTEGER PRIMARY KEY AUTOINCREMENT, judul TEXT NOT NULL, deskripsi TEXT, kategori TEXT,
  jenjang TEXT, jenis TEXT, file_url TEXT, file_name TEXT, file_size INTEGER,
  uploaded_by INTEGER NOT NULL, download_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS pengumuman (
  id INTEGER PRIMARY KEY AUTOINCREMENT, judul TEXT NOT NULL, isi TEXT NOT NULL,
  kategori TEXT DEFAULT 'umum', is_pinned INTEGER DEFAULT 0, created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS forum_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT, judul TEXT NOT NULL, isi TEXT NOT NULL, kategori TEXT,
  user_id INTEGER NOT NULL, is_pinned INTEGER DEFAULT 0, reply_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS forum_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
  isi TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;
    const stmts = schema.split(';').filter(s => s.trim());
    for (const stmt of stmts) {
      await c.env.DB.prepare(stmt).run();
    }

    // Seed default admin (password: admin123)
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (1, 'Admin KKG Gugus 3', 'admin@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin', '198501012010011001', 'SDN 1 Wanayasa', 'Guru Kelas', '081234567890')`).run();
    
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('mistral_api_key', '')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('nama_ketua', 'Admin KKG Gugus 3')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('alamat_sekretariat', 'SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('tahun_ajaran', '2025/2026')`).run();

    // Seed sample data
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (2, 'Siti Nurhaliza', 'siti@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198602022011012002', 'SDN 2 Wanayasa', 'Matematika', '081234567891')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (3, 'Budi Santoso', 'budi@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198703032012011003', 'SDN 3 Wanayasa', 'IPA', '081234567892')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (4, 'Dewi Lestari', 'dewi@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198804042013012004', 'SDN 1 Wanayasa', 'Bahasa Indonesia', '081234567893')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (5, 'Ahmad Fauzi', 'ahmad@kkg-wanayasa.id', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'user', '198905052014011005', 'SDN 4 Wanayasa', 'IPS', '081234567894')`).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO pengumuman (id, judul, isi, kategori, is_pinned, created_by)
      VALUES (1, 'Selamat Datang di Portal Digital KKG Gugus 3 Wanayasa', 'Assalamualaikum Wr. Wb.\n\nDengan penuh rasa syukur, kami meluncurkan Portal Digital KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta.\n\nPortal ini dirancang untuk memudahkan koordinasi, komunikasi, dan kolaborasi antar guru.\n\nWassalamualaikum Wr. Wb.', 'umum', 1, 1)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO pengumuman (id, judul, isi, kategori, is_pinned, created_by)
      VALUES (2, 'Jadwal Rapat Rutin KKG Bulan Februari 2026', 'Rapat rutin bulanan:\n\nHari/Tanggal: Sabtu, 14 Februari 2026\nWaktu: 09.00 - 12.00 WIB\nTempat: SDN 1 Wanayasa\nAgenda: Evaluasi Program Semester Ganjil', 'jadwal', 1, 1)`).run();
    
    await c.env.DB.prepare(`INSERT OR IGNORE INTO kegiatan (id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi, created_by)
      VALUES (1, 'Rapat Rutin KKG Februari 2026', '2026-02-14', '09:00', '12:00', 'SDN 1 Wanayasa', 'Evaluasi Program Semester Ganjil', 1)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO kegiatan (id, nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi, created_by)
      VALUES (2, 'Workshop Kurikulum Merdeka', '2026-02-28', '08:00', '16:00', 'SDN 1 Wanayasa', 'Workshop implementasi Kurikulum Merdeka Belajar', 1)`).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO forum_threads (id, judul, isi, kategori, user_id, reply_count)
      VALUES (1, 'Sharing Best Practice: Pembelajaran Diferensiasi di SD', 'Saya ingin berbagi pengalaman tentang penerapan pembelajaran diferensiasi di kelas saya. Bagaimana pengalaman rekan-rekan?', 'best-practice', 2, 1)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO forum_replies (id, thread_id, user_id, isi)
      VALUES (1, 1, 3, 'Saya sudah mencoba pembelajaran diferensiasi dengan membagi siswa berdasarkan gaya belajar. Hasilnya cukup positif!')`).run();

    return c.json({ success: true, message: 'Database berhasil diinisialisasi!' });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Serve SPA for all other routes
app.get('*', (c) => {
  return c.html(renderHTML());
});

export default app;
