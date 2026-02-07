import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';

type Bindings = { DB: D1Database };

const forum = new Hono<{ Bindings: Bindings }>();

// List threads (public)
forum.get('/threads', async (c) => {
  const kategori = c.req.query('kategori') || '';
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `SELECT ft.*, u.nama as author_name, u.sekolah as author_sekolah 
    FROM forum_threads ft LEFT JOIN users u ON ft.user_id = u.id WHERE 1=1`;
  const params: any[] = [];

  if (kategori) {
    query += ' AND ft.kategori = ?';
    params.push(kategori);
  }

  query += ' ORDER BY ft.is_pinned DESC, ft.updated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const stmt = c.env.DB.prepare(query);
  const results = await (params.length > 0 ? stmt.bind(...params) : stmt).all();

  return c.json({ data: results.results });
});

// Get thread with replies (public)
forum.get('/threads/:id', async (c) => {
  const id = c.req.param('id');
  
  const thread = await c.env.DB.prepare(`
    SELECT ft.*, u.nama as author_name, u.sekolah as author_sekolah
    FROM forum_threads ft LEFT JOIN users u ON ft.user_id = u.id WHERE ft.id = ?
  `).bind(id).first();

  if (!thread) return c.json({ error: 'Thread tidak ditemukan' }, 404);

  const replies = await c.env.DB.prepare(`
    SELECT fr.*, u.nama as author_name, u.sekolah as author_sekolah
    FROM forum_replies fr LEFT JOIN users u ON fr.user_id = u.id
    WHERE fr.thread_id = ? ORDER BY fr.created_at ASC
  `).bind(id).all();

  return c.json({ data: { thread, replies: replies.results } });
});

// Create thread
forum.post('/threads', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const { judul, isi, kategori } = await c.req.json();
  if (!judul || !isi) return c.json({ error: 'Judul dan isi harus diisi' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO forum_threads (judul, isi, kategori, user_id) VALUES (?, ?, ?, ?)'
  ).bind(judul, isi, kategori || 'umum', user.id).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

// Reply to thread
forum.post('/threads/:id/reply', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const threadId = c.req.param('id');
  const { isi } = await c.req.json();
  if (!isi) return c.json({ error: 'Isi balasan harus diisi' }, 400);

  await c.env.DB.prepare(
    'INSERT INTO forum_replies (thread_id, user_id, isi) VALUES (?, ?, ?)'
  ).bind(threadId, user.id, isi).run();

  await c.env.DB.prepare(
    'UPDATE forum_threads SET reply_count = reply_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(threadId).run();

  return c.json({ success: true });
});

// Delete thread (author or admin)
forum.delete('/threads/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const id = c.req.param('id');
  const thread: any = await c.env.DB.prepare('SELECT user_id FROM forum_threads WHERE id = ?').bind(id).first();

  if (!thread) return c.json({ error: 'Thread tidak ditemukan' }, 404);
  if (thread.user_id !== user.id && user.role !== 'admin') {
    return c.json({ error: 'Akses ditolak' }, 403);
  }

  await c.env.DB.prepare('DELETE FROM forum_threads WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default forum;
