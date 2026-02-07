import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';

type Bindings = { DB: D1Database };

const guru = new Hono<{ Bindings: Bindings }>();

// List all guru (public)
guru.get('/', async (c) => {
  const search = c.req.query('search') || '';
  const sekolah = c.req.query('sekolah') || '';
  
  let query = 'SELECT id, nama, nip, nik, mata_pelajaran, sekolah, no_hp, foto_url FROM users WHERE 1=1';
  const params: string[] = [];

  if (search) {
    query += ' AND (nama LIKE ? OR nip LIKE ? OR mata_pelajaran LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (sekolah) {
    query += ' AND sekolah = ?';
    params.push(sekolah);
  }

  query += ' ORDER BY nama ASC';

  const stmt = c.env.DB.prepare(query);
  const results = await (params.length > 0 ? stmt.bind(...params) : stmt).all();

  return c.json({ data: results.results });
});

// Get sekolah list
guru.get('/sekolah', async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT DISTINCT sekolah FROM users WHERE sekolah IS NOT NULL AND sekolah != "" ORDER BY sekolah ASC'
  ).all();
  return c.json({ data: results.results.map((r: any) => r.sekolah) });
});

// Update guru profile (self or admin)
guru.put('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const id = parseInt(c.req.param('id'));
  if (user.id !== id && user.role !== 'admin') {
    return c.json({ error: 'Akses ditolak' }, 403);
  }

  const body = await c.req.json();
  const { nama, nip, nik, mata_pelajaran, sekolah, no_hp, alamat } = body;

  await c.env.DB.prepare(`
    UPDATE users SET nama=?, nip=?, nik=?, mata_pelajaran=?, sekolah=?, no_hp=?, alamat=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).bind(nama, nip || null, nik || null, mata_pelajaran || null, sekolah || null, no_hp || null, alamat || null, id).run();

  return c.json({ success: true });
});

// Admin: delete user
guru.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') return c.json({ error: 'Akses ditolak' }, 403);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM users WHERE id = ? AND role != ?').bind(id, 'admin').run();
  return c.json({ success: true });
});

// Admin: update user role
guru.put('/:id/role', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') return c.json({ error: 'Akses ditolak' }, 403);

  const id = c.req.param('id');
  const { role } = await c.req.json();

  await c.env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, id).run();
  return c.json({ success: true });
});

export default guru;
