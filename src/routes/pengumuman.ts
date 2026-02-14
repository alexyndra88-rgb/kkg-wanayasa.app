import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { CreatePengumumanRequest, PengumumanWithAuthor } from '../types';
import { createBulkNotifications } from '../lib/notification';

type Bindings = { DB: D1Database };

const pengumuman = new Hono<{ Bindings: Bindings }>();

// Get all pengumuman (public)
pengumuman.get('/', async (c) => {
  try {
    const kategori = c.req.query('kategori') || '';
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);

    let query = `
      SELECT p.*, u.nama as author_name
      FROM pengumuman p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (kategori) {
      query += ` AND p.kategori = ?`;
      params.push(kategori);
    }

    query += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ?`;
    params.push(limit);

    const stmt = c.env.DB.prepare(query);
    const results = await stmt.bind(...params).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get pengumuman error:', e);
    return Errors.internal(c);
  }
});

// Create pengumuman (admin only)
pengumuman.post('/', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  if (user.role !== 'admin') {
    return Errors.forbidden(c, 'Hanya admin yang dapat membuat pengumuman');
  }

  try {
    const body = await c.req.json() as CreatePengumumanRequest;

    const validation = validateRequired(body, ['judul', 'isi']);
    if (!validation.valid) {
      return Errors.validation(c, `Field berikut harus diisi: ${validation.missing.join(', ')}`);
    }

    const { judul, isi, kategori, is_pinned } = body;

    // Validate kategori
    const validKategori = ['umum', 'jadwal', 'kegiatan', 'penting'];
    const finalKategori = kategori && validKategori.includes(kategori) ? kategori : 'umum';

    const result = await c.env.DB.prepare(`
      INSERT INTO pengumuman (judul, isi, kategori, is_pinned, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      judul.trim(),
      isi.trim(),
      finalKategori,
      is_pinned ? 1 : 0,
      user.id
    ).run();

    // 🔔 Broadcast Notification
    try {
      const { results } = await c.env.DB.prepare('SELECT id FROM users WHERE id != ?').bind(user.id).all();
      const recipientIds = results.map((u: any) => u.id as number);

      if (recipientIds.length > 0) {
        await createBulkNotifications(
          c.env.DB,
          recipientIds,
          'Pengumuman Baru 📢',
          `"${judul}" telah diterbitkan oleh Admin.`,
          is_pinned ? 'warning' : 'info',
          '/pengumuman'
        );
      }
    } catch (err) {
      console.error('Failed to broadcast pengumuman:', err);
    }

    return successResponse(c, {
      id: result.meta.last_row_id,
      judul,
      kategori: finalKategori,
      is_pinned: Boolean(is_pinned)
    }, 'Pengumuman berhasil dibuat', 201);
  } catch (e: any) {
    console.error('Create pengumuman error:', e);
    return Errors.internal(c);
  }
});

// Get pengumuman detail
pengumuman.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID pengumuman tidak valid');
    }

    const result: any = await c.env.DB.prepare(`
      SELECT p.*, u.nama as author_name
      FROM pengumuman p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).bind(id).first();

    if (!result) {
      return Errors.notFound(c, 'Pengumuman');
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Get pengumuman detail error:', e);
    return Errors.internal(c);
  }
});

// Update pengumuman (admin only)
pengumuman.put('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID pengumuman tidak valid');
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM pengumuman WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return Errors.notFound(c, 'Pengumuman');
    }

    const { judul, isi, kategori, is_pinned } = await c.req.json();

    if (!judul || !isi) {
      return Errors.validation(c, 'Judul dan isi harus diisi');
    }

    const validKategori = ['umum', 'jadwal', 'kegiatan', 'penting'];
    const finalKategori = kategori && validKategori.includes(kategori) ? kategori : 'umum';

    await c.env.DB.prepare(`
      UPDATE pengumuman 
      SET judul = ?, isi = ?, kategori = ?, is_pinned = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(judul.trim(), isi.trim(), finalKategori, is_pinned ? 1 : 0, id).run();

    return successResponse(c, { id: Number(id) }, 'Pengumuman berhasil diperbarui');
  } catch (e: any) {
    console.error('Update pengumuman error:', e);
    return Errors.internal(c);
  }
});

// Delete pengumuman (admin only)
pengumuman.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID pengumuman tidak valid');
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM pengumuman WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return Errors.notFound(c, 'Pengumuman');
    }

    await c.env.DB.prepare('DELETE FROM pengumuman WHERE id = ?').bind(id).run();

    return successResponse(c, null, 'Pengumuman berhasil dihapus');
  } catch (e: any) {
    console.error('Delete pengumuman error:', e);
    return Errors.internal(c);
  }
});

export default pengumuman;
