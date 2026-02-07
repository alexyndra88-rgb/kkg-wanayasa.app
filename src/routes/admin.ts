import { Hono } from 'hono';
import { getCurrentUser, getCookie, hashPassword } from '../lib/auth';

type Bindings = { DB: D1Database };

const admin = new Hono<{ Bindings: Bindings }>();

// Middleware: check admin
admin.use('*', async (c, next) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Akses ditolak. Hanya admin.' }, 403);
  }
  c.set('user' as any, user);
  await next();
});

// Get settings
admin.get('/settings', async (c) => {
  const results = await c.env.DB.prepare('SELECT key, value FROM settings').all();
  const settings: Record<string, string> = {};
  results.results.forEach((r: any) => {
    // Mask API key for security
    if (r.key === 'mistral_api_key' && r.value) {
      settings[r.key] = r.value.substring(0, 8) + '...' + (r.value.length > 12 ? r.value.substring(r.value.length - 4) : '');
    } else {
      settings[r.key] = r.value;
    }
  });
  return c.json({ data: settings });
});

// Update settings
admin.put('/settings', async (c) => {
  const body = await c.req.json();
  
  for (const [key, value] of Object.entries(body)) {
    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
    ).bind(key, value as string).run();
  }

  return c.json({ success: true, message: 'Pengaturan berhasil disimpan' });
});

// Get all users
admin.get('/users', async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT id, nama, email, role, nip, sekolah, mata_pelajaran, no_hp, created_at FROM users ORDER BY nama ASC'
  ).all();
  return c.json({ data: results.results });
});

// Reset user password
admin.post('/users/:id/reset-password', async (c) => {
  const id = c.req.param('id');
  const { new_password } = await c.req.json();
  
  if (!new_password || new_password.length < 6) {
    return c.json({ error: 'Password minimal 6 karakter' }, 400);
  }

  const hash = await hashPassword(new_password);
  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, id).run();

  return c.json({ success: true, message: 'Password berhasil direset' });
});

// Dashboard stats
admin.get('/dashboard', async (c) => {
  const userCount: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first();
  const suratCount: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM surat_undangan').first();
  const prokerCount: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM program_kerja').first();
  const kegiatanCount: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM kegiatan').first();
  const materiCount: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM materi').first();
  const threadCount: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM forum_threads').first();
  const pengumumanCount: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM pengumuman').first();

  return c.json({
    data: {
      total_guru: userCount.cnt,
      total_surat: suratCount.cnt,
      total_proker: prokerCount.cnt,
      total_kegiatan: kegiatanCount.cnt,
      total_materi: materiCount.cnt,
      total_diskusi: threadCount.cnt,
      total_pengumuman: pengumumanCount.cnt,
    }
  });
});

export default admin;
