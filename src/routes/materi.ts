import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';

type Bindings = { DB: D1Database };

const materi = new Hono<{ Bindings: Bindings }>();

// List materi (public)
materi.get('/', async (c) => {
  const kategori = c.req.query('kategori') || '';
  const jenis = c.req.query('jenis') || '';
  const jenjang = c.req.query('jenjang') || '';
  const search = c.req.query('search') || '';
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `SELECT m.*, u.nama as uploader_name 
    FROM materi m LEFT JOIN users u ON m.uploaded_by = u.id WHERE 1=1`;
  const params: any[] = [];

  if (kategori) { query += ' AND m.kategori = ?'; params.push(kategori); }
  if (jenis) { query += ' AND m.jenis = ?'; params.push(jenis); }
  if (jenjang) { query += ' AND m.jenjang = ?'; params.push(jenjang); }
  if (search) { query += ' AND (m.judul LIKE ? OR m.deskripsi LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = c.env.DB.prepare(query);
  const results = await (params.length > 0 ? stmt.bind(...params) : stmt).all();

  return c.json({ data: results.results });
});

// Upload materi metadata (file stored as base64 or external URL)
materi.post('/', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const { judul, deskripsi, kategori, jenjang, jenis, file_url, file_name, file_size } = await c.req.json();
  if (!judul) return c.json({ error: 'Judul harus diisi' }, 400);

  const result = await c.env.DB.prepare(`
    INSERT INTO materi (judul, deskripsi, kategori, jenjang, jenis, file_url, file_name, file_size, uploaded_by) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(judul, deskripsi || null, kategori || null, jenjang || null, jenis || null, file_url || null, file_name || null, file_size || 0, user.id).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

// Increment download counter
materi.post('/:id/download', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE materi SET download_count = download_count + 1 WHERE id = ?').bind(id).run();
  const m: any = await c.env.DB.prepare('SELECT file_url FROM materi WHERE id = ?').bind(id).first();
  return c.json({ success: true, file_url: m?.file_url });
});

// Delete materi (uploader or admin)
materi.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const id = c.req.param('id');
  const m: any = await c.env.DB.prepare('SELECT uploaded_by FROM materi WHERE id = ?').bind(id).first();

  if (!m) return c.json({ error: 'Materi tidak ditemukan' }, 404);
  if (m.uploaded_by !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Akses ditolak' }, 403);
  }

  await c.env.DB.prepare('DELETE FROM materi WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default materi;
