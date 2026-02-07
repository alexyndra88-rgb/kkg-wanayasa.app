import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';

type Bindings = { DB: D1Database };

const pengumuman = new Hono<{ Bindings: Bindings }>();

// List pengumuman (public)
pengumuman.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  const results = await c.env.DB.prepare(`
    SELECT p.*, u.nama as author_name 
    FROM pengumuman p LEFT JOIN users u ON p.created_by = u.id 
    ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, offset).all();

  const count: any = await c.env.DB.prepare('SELECT COUNT(*) as total FROM pengumuman').first();

  return c.json({ data: results.results, total: count.total });
});

// Get single pengumuman
pengumuman.get('/:id', async (c) => {
  const id = c.req.param('id');
  const result = await c.env.DB.prepare(`
    SELECT p.*, u.nama as author_name 
    FROM pengumuman p LEFT JOIN users u ON p.created_by = u.id 
    WHERE p.id = ?
  `).bind(id).first();

  if (!result) return c.json({ error: 'Pengumuman tidak ditemukan' }, 404);
  return c.json({ data: result });
});

// Create pengumuman (admin only)
pengumuman.post('/', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') return c.json({ error: 'Akses ditolak' }, 403);

  const { judul, isi, kategori, is_pinned } = await c.req.json();
  if (!judul || !isi) return c.json({ error: 'Judul dan isi harus diisi' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO pengumuman (judul, isi, kategori, is_pinned, created_by) VALUES (?, ?, ?, ?, ?)'
  ).bind(judul, isi, kategori || 'umum', is_pinned ? 1 : 0, user.id).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

// Update pengumuman
pengumuman.put('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') return c.json({ error: 'Akses ditolak' }, 403);

  const id = c.req.param('id');
  const { judul, isi, kategori, is_pinned } = await c.req.json();

  await c.env.DB.prepare(
    'UPDATE pengumuman SET judul=?, isi=?, kategori=?, is_pinned=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(judul, isi, kategori || 'umum', is_pinned ? 1 : 0, id).run();

  return c.json({ success: true });
});

// Delete pengumuman
pengumuman.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') return c.json({ error: 'Akses ditolak' }, 403);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM pengumuman WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default pengumuman;
