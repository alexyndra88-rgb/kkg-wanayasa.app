import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { CreateThreadRequest, CreateReplyRequest, ForumThreadWithAuthor, ForumReplyWithAuthor } from '../types';
import { createNotification } from '../lib/notification';

type Bindings = { DB: D1Database };

const forum = new Hono<{ Bindings: Bindings }>();

// Get all threads
forum.get('/threads', async (c) => {
  try {
    const kategori = c.req.query('kategori') || '';
    const search = c.req.query('search') || '';

    let query = `
      SELECT t.*, u.nama as author_name
      FROM forum_threads t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (kategori) {
      query += ` AND t.kategori = ?`;
      params.push(kategori);
    }
    if (search) {
      query += ` AND (t.judul LIKE ? OR t.isi LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.is_pinned DESC, t.updated_at DESC LIMIT 100`;

    const stmt = c.env.DB.prepare(query);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get threads error:', e);
    return Errors.internal(c);
  }
});

// Create thread
forum.post('/threads', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const body = await c.req.json() as CreateThreadRequest;

    const validation = validateRequired(body, ['judul', 'isi']);
    if (!validation.valid) {
      return Errors.validation(c, `Field berikut harus diisi: ${validation.missing.join(', ')}`);
    }

    const { judul, isi, kategori } = body;

    // Validate kategori
    const validKategori = ['umum', 'best-practice', 'kurikulum', 'teknologi', 'tanya-jawab'];
    const finalKategori = kategori && validKategori.includes(kategori) ? kategori : 'umum';

    const result = await c.env.DB.prepare(`
      INSERT INTO forum_threads (judul, isi, kategori, user_id, reply_count)
      VALUES (?, ?, ?, ?, 0)
    `).bind(
      judul.trim(),
      isi.trim(),
      finalKategori,
      user.id
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      judul,
      kategori: finalKategori
    }, 'Topik diskusi berhasil dibuat', 201);
  } catch (e: any) {
    console.error('Create thread error:', e);
    return Errors.internal(c);
  }
});

// Get thread detail with replies
forum.get('/threads/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID thread tidak valid');
    }

    // Get thread
    const thread: any = await c.env.DB.prepare(`
      SELECT t.*, u.nama as author_name
      FROM forum_threads t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).bind(id).first();

    if (!thread) {
      return Errors.notFound(c, 'Topik diskusi');
    }

    // Get replies
    const replies = await c.env.DB.prepare(`
      SELECT r.*, u.nama as author_name
      FROM forum_replies r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.thread_id = ?
      ORDER BY r.created_at ASC
    `).bind(id).all();

    return successResponse(c, {
      thread,
      replies: replies.results
    });
  } catch (e: any) {
    console.error('Get thread detail error:', e);
    return Errors.internal(c);
  }
});

// Reply to thread
forum.post('/threads/:id/reply', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID thread tidak valid');
    }

    const body = await c.req.json() as CreateReplyRequest;

    if (!body.isi || body.isi.trim().length === 0) {
      return Errors.validation(c, 'Isi balasan tidak boleh kosong');
    }

    // Check thread exists
    const thread: any = await c.env.DB.prepare(
      'SELECT id, user_id, judul FROM forum_threads WHERE id = ?'
    ).bind(id).first();

    if (!thread) {
      return Errors.notFound(c, 'Topik diskusi');
    }

    // Insert reply
    const result = await c.env.DB.prepare(`
      INSERT INTO forum_replies (thread_id, user_id, isi)
      VALUES (?, ?, ?)
    `).bind(id, user.id, body.isi.trim()).run();

    // Update reply count
    await c.env.DB.prepare(`
      UPDATE forum_threads 
      SET reply_count = reply_count + 1, updated_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    // 🔔 Notify thread owner
    if (thread.user_id !== user.id) {
      try {
        await createNotification(
          c.env.DB,
          thread.user_id,
          'Balasan Baru 💬',
          `${user.nama} membalas diskusi "${thread.judul}".`,
          'info',
          `/forum` // Ideally /forum/threads/:id but UI doesn't support deep link yet? use /forum
        );
      } catch (e) { console.error(e); }
    }

    return successResponse(c, {
      id: result.meta.last_row_id,
      thread_id: Number(id)
    }, 'Balasan berhasil dikirim', 201);
  } catch (e: any) {
    console.error('Reply thread error:', e);
    return Errors.internal(c);
  }
});

// Delete thread (owner or admin)
forum.delete('/threads/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID thread tidak valid');
    }

    const thread: any = await c.env.DB.prepare(
      'SELECT id, user_id FROM forum_threads WHERE id = ?'
    ).bind(id).first();

    if (!thread) {
      return Errors.notFound(c, 'Topik diskusi');
    }

    if (thread.user_id !== user.id && user.role !== 'admin') {
      return Errors.forbidden(c, 'Anda tidak memiliki akses untuk menghapus topik ini');
    }

    await c.env.DB.prepare('DELETE FROM forum_threads WHERE id = ?').bind(id).run();

    return successResponse(c, null, 'Topik diskusi berhasil dihapus');
  } catch (e: any) {
    console.error('Delete thread error:', e);
    return Errors.internal(c);
  }
});

// Toggle pin thread (admin only)
forum.put('/threads/:id/pin', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID thread tidak valid');
    }

    const thread: any = await c.env.DB.prepare(
      'SELECT id, is_pinned FROM forum_threads WHERE id = ?'
    ).bind(id).first();

    if (!thread) {
      return Errors.notFound(c, 'Topik diskusi');
    }

    const newPinStatus = thread.is_pinned ? 0 : 1;
    await c.env.DB.prepare(
      'UPDATE forum_threads SET is_pinned = ? WHERE id = ?'
    ).bind(newPinStatus, id).run();

    return successResponse(c, {
      id: Number(id),
      is_pinned: Boolean(newPinStatus)
    }, newPinStatus ? 'Topik berhasil disematkan' : 'Topik berhasil dilepas sematan');
  } catch (e: any) {
    console.error('Pin thread error:', e);
    return Errors.internal(c);
  }
});

export default forum;
