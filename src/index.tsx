import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import authRoutes from './routes/auth';
import suratRoutes from './routes/surat';
import prokerRoutes from './routes/proker';
import absensiRoutes from './routes/absensi';
import guruRoutes from './routes/guru';
import pengumumanRoutes from './routes/pengumuman';
import forumRoutes from './routes/forum';
import materiRoutes from './routes/materi';
import adminRoutes from './routes/admin';
import filesRoutes from './routes/files';
import dashboardRoutes from './routes/dashboard';
import calendarRoutes from './routes/calendar';
import templatesRoutes from './routes/templates';
import sekolahRoutes from './routes/sekolah';
import settingsRoutes from './routes/settings';
import profileRoutes from './routes/profile';
import { renderHTML } from './templates/layout';
import { rateLimitMiddleware, RATE_LIMITS } from './lib/ratelimit';
import { successResponse, Errors } from './lib/response';
import { hashPassword } from './lib/auth';
import { loggingMiddleware, logger } from './lib/logger';
import { csrfMiddleware, getOrCreateCSRFToken } from './lib/csrf';
import type { R2Bucket } from './lib/upload';

type Bindings = {
  DB: D1Database;
  BUCKET?: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// Logging Middleware (must be first)
app.use('/api/*', loggingMiddleware());

// Security Headers
app.use('*', secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
}));

// CORS - with proper configuration
app.use('/api/*', cors({
  origin: (origin) => {
    // Allow same-origin and localhost for development
    if (!origin) return '*';
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin;
    if (origin.includes('kkg-wanayasa')) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400,
}));

// General rate limiting for all API routes
app.use('/api/*', rateLimitMiddleware(RATE_LIMITS.api));

// CSRF Protection Middleware (validates token on POST/PUT/DELETE)
app.use('/api/*', csrfMiddleware());

// Cache-Control headers for static files
// Prevent browser from aggressively caching JS/CSS files
app.use('/static/*', async (c, next) => {
  await next();
  const url = c.req.url;
  if (url.endsWith('.js') || url.endsWith('.css')) {
    // JS and CSS: must revalidate every time
    c.header('Cache-Control', 'no-cache, must-revalidate');
    c.header('Pragma', 'no-cache');
  } else if (/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf)/.test(url)) {
    // Images and fonts: cache for 1 day
    c.header('Cache-Control', 'public, max-age=86400');
  }
});

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
import laporanRoutes from './routes/laporan';

// ... existing routes ...
app.route('/api/files', filesRoutes);
app.route('/api/laporan', laporanRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/calendar', calendarRoutes);
app.route('/api/templates', templatesRoutes);
app.route('/api/sekolah', sekolahRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/profile', profileRoutes);

// Health check endpoint
app.get('/api/health', (c) => {
  return successResponse(c, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_surat_user ON surat_undangan(user_id);
CREATE INDEX IF NOT EXISTS idx_proker_user ON program_kerja(user_id);
CREATE INDEX IF NOT EXISTS idx_absensi_kegiatan ON absensi(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_absensi_user ON absensi(user_id);
CREATE INDEX IF NOT EXISTS idx_materi_kategori ON materi(kategori);
CREATE INDEX IF NOT EXISTS idx_forum_threads_user ON forum_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread ON forum_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_pengumuman_pinned ON pengumuman(is_pinned);
CREATE TABLE IF NOT EXISTS surat_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL,
  deskripsi TEXT,
  konten TEXT NOT NULL,
  variables TEXT,
  is_active INTEGER DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_jenis ON surat_templates(jenis);
CREATE INDEX IF NOT EXISTS idx_templates_active ON surat_templates(is_active);
CREATE TABLE IF NOT EXISTS sekolah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  npsn TEXT UNIQUE,
  tipe TEXT DEFAULT 'negeri' CHECK(tipe IN ('negeri', 'swasta')),
  alamat TEXT,
  kepala_sekolah TEXT,
  jumlah_guru INTEGER,
  is_sekretariat INTEGER DEFAULT 0,
  is_sekolah_penggerak INTEGER DEFAULT 0,
  keterangan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sekolah_nama ON sekolah(nama);
CREATE INDEX IF NOT EXISTS idx_sekolah_tipe ON sekolah(tipe);
`;
    const stmts = schema.split(';').filter(s => s.trim());
    for (const stmt of stmts) {
      await c.env.DB.prepare(stmt).run();
    }

    // Hash password with new PBKDF2 method
    const adminPasswordHash = await hashPassword('admin123');

    // Seed default admin with secure password hash
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (1, 'Admin KKG Gugus 3', 'admin@kkg-wanayasa.id', ?, 'admin', '198501012010011001', 'SDN 1 Wanayasa', 'Guru Kelas', '081234567890')`)
      .bind(adminPasswordHash).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('mistral_api_key', '')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('nama_ketua', 'Admin KKG Gugus 3')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('alamat_sekretariat', 'SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('tahun_ajaran', '2025/2026')`).run();

    // Seed sample users with secure password hash
    const userPasswordHash = await hashPassword('admin123');

    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (2, 'Siti Nurhaliza', 'siti@kkg-wanayasa.id', ?, 'user', '198602022011012002', 'SDN 2 Wanayasa', 'Matematika', '081234567891')`)
      .bind(userPasswordHash).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (3, 'Budi Santoso', 'budi@kkg-wanayasa.id', ?, 'user', '198703032012011003', 'SDN 3 Wanayasa', 'IPA', '081234567892')`)
      .bind(userPasswordHash).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (4, 'Dewi Lestari', 'dewi@kkg-wanayasa.id', ?, 'user', '198804042013012004', 'SDN 1 Wanayasa', 'Bahasa Indonesia', '081234567893')`)
      .bind(userPasswordHash).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO users (id, nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp)
      VALUES (5, 'Ahmad Fauzi', 'ahmad@kkg-wanayasa.id', ?, 'user', '198905052014011005', 'SDN 4 Wanayasa', 'IPS', '081234567894')`)
      .bind(userPasswordHash).run();

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

    // Seed sekolah data (9 sekolah anggota KKG Gugus 3 Wanayasa)
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (1, 'SDN 2 Nangerang', 'negeri', 1, 0, 'Sekretariat KKG Gugus 3')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (2, 'SDN 1 Nangerang', 'negeri', 0, 0, NULL)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (3, 'SDN Nagrog', 'negeri', 0, 0, NULL)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (4, 'SDN Raharja', 'negeri', 0, 1, 'Sekolah Penggerak')`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (5, 'SDN 1 Cibuntu', 'negeri', 0, 0, NULL)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (6, 'SDN 2 Cibuntu', 'negeri', 0, 0, NULL)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (7, 'SDN Sumurugul', 'negeri', 0, 0, NULL)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (8, 'SDN Sakambang', 'negeri', 0, 0, NULL)`).run();
    await c.env.DB.prepare(`INSERT OR IGNORE INTO sekolah (id, nama, tipe, is_sekretariat, is_sekolah_penggerak, keterangan)
      VALUES (9, 'SDIT Al-Qalam', 'swasta', 0, 0, 'Sekolah Swasta')`).run();

    // Seed formal letter templates
    await c.env.DB.prepare(`INSERT OR IGNORE INTO surat_templates (id, nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (1, 'Undangan Rapat Rutin KKG', 'undangan', 'Template undangan untuk rapat rutin bulanan KKG Gugus 3 Wanayasa',
'Dengan hormat,

Sehubungan dengan agenda kegiatan Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta, dengan ini kami mengundang Bapak/Ibu Guru untuk menghadiri:

Hari/Tanggal  : {{tanggal}}
Waktu         : {{waktu}}
Tempat        : {{tempat}}
Acara         : {{acara}}

Mengingat pentingnya acara ini, kami mohon kehadiran Bapak/Ibu tepat pada waktunya. Dimohon untuk membawa berkas-berkas yang diperlukan.

Demikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.', '["tanggal", "waktu", "tempat", "acara"]', 1, 1)`).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO surat_templates (id, nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (2, 'Undangan Workshop/Pelatihan', 'undangan', 'Template undangan untuk workshop, pelatihan, atau seminar KKG',
'Dengan hormat,

Dalam rangka meningkatkan kompetensi dan profesionalisme guru di lingkungan KKG Gugus 3 Kecamatan Wanayasa, kami akan menyelenggarakan:

Kegiatan      : {{nama_kegiatan}}
Tema          : {{tema}}
Hari/Tanggal  : {{tanggal}}
Waktu         : {{waktu}}
Tempat        : {{tempat}}
Narasumber    : {{narasumber}}

Sehubungan dengan hal tersebut, kami mengundang Bapak/Ibu Guru untuk berpartisipasi dalam kegiatan dimaksud.

Peserta diwajibkan untuk:
1. Hadir tepat waktu
2. Membawa laptop/gadget (jika diperlukan)
3. Mengikuti kegiatan sampai selesai

Demikian undangan ini kami sampaikan. Atas perhatian dan partisipasinya, kami ucapkan terima kasih.', '["nama_kegiatan", "tema", "tanggal", "waktu", "tempat", "narasumber"]', 1, 1)`).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO surat_templates (id, nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (3, 'Surat Tugas Kegiatan', 'tugas', 'Template surat tugas untuk menugaskan guru dalam kegiatan resmi',
'Yang bertanda tangan di bawah ini, Ketua KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta, dengan ini menugaskan kepada:

Nama          : {{nama_guru}}
NIP           : {{nip}}
Pangkat/Gol.  : {{pangkat}}
Jabatan       : {{jabatan}}
Unit Kerja    : {{unit_kerja}}

Untuk melaksanakan tugas sebagai {{tugas}} dalam kegiatan:

Nama Kegiatan : {{nama_kegiatan}}
Hari/Tanggal  : {{tanggal}}
Waktu         : {{waktu}}
Tempat        : {{tempat}}

Demikian surat tugas ini dibuat untuk dapat dipergunakan sebagaimana mestinya.', '["nama_guru", "nip", "pangkat", "jabatan", "unit_kerja", "tugas", "nama_kegiatan", "tanggal", "waktu", "tempat"]', 1, 1)`).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO surat_templates (id, nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (4, 'Surat Keterangan Aktif Anggota', 'keterangan', 'Template surat keterangan keaktifan anggota KKG',
'Yang bertanda tangan di bawah ini, Ketua KKG Gugus 3 Kecamatan Wanayasa, Kabupaten Purwakarta, menerangkan bahwa:

Nama          : {{nama_guru}}
NIP           : {{nip}}
Pangkat/Gol.  : {{pangkat}}
Jabatan       : {{jabatan}}
Unit Kerja    : {{unit_kerja}}

Adalah benar-benar anggota aktif Kelompok Kerja Guru (KKG) Gugus 3 Kecamatan Wanayasa dan telah mengikuti kegiatan-kegiatan yang diselenggarakan oleh KKG sejak tahun {{tahun_bergabung}}.

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.

Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.', '["nama_guru", "nip", "pangkat", "jabatan", "unit_kerja", "tahun_bergabung", "keperluan"]', 1, 1)`).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO surat_templates (id, nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (5, 'Surat Edaran Umum', 'edaran', 'Template surat edaran untuk pemberitahuan umum kepada anggota KKG',
'Kepada Yth.
{{tujuan}}
di Tempat

Dengan hormat,

Berdasarkan {{dasar_surat}}, dengan ini kami sampaikan hal-hal sebagai berikut:

{{isi_edaran}}

Demikian surat edaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.', '["tujuan", "dasar_surat", "isi_edaran"]', 1, 1)`).run();

    await c.env.DB.prepare(`INSERT OR IGNORE INTO surat_templates (id, nama, jenis, deskripsi, konten, variables, is_active, created_by)
      VALUES (6, 'Permohonan Narasumber', 'permohonan', 'Template surat permohonan narasumber untuk kegiatan KKG',
'Kepada Yth.
{{nama_tujuan}}
{{jabatan_tujuan}}
di {{alamat_tujuan}}

Dengan hormat,

Dalam rangka meningkatkan kompetensi dan profesionalisme guru di lingkungan KKG Gugus 3 Kecamatan Wanayasa, kami bermaksud menyelenggarakan kegiatan:

Nama Kegiatan : {{nama_kegiatan}}
Tema          : {{tema}}
Hari/Tanggal  : {{tanggal}}
Waktu         : {{waktu}}
Tempat        : {{tempat}}

Sehubungan dengan hal tersebut, kami mohon kesediaan Bapak/Ibu untuk menjadi narasumber dalam kegiatan dimaksud dengan materi: {{materi}}.

Besar harapan kami atas kesediaan Bapak/Ibu dan kami siap menyediakan akomodasi yang diperlukan.

Demikian permohonan ini kami sampaikan. Atas perhatian dan kesediaannya, kami ucapkan terima kasih.', '["nama_tujuan", "jabatan_tujuan", "alamat_tujuan", "nama_kegiatan", "tema", "tanggal", "waktu", "tempat", "materi"]', 1, 1)`).run();

    return successResponse(c, null, 'Database berhasil diinisialisasi!');
  } catch (e: any) {
    console.error('Init DB error:', e);
    return Errors.internal(c, e.message);
  }
});

// Serve SPA for all other routes
app.get('*', (c) => {
  return c.html(renderHTML());
});

export default app;
