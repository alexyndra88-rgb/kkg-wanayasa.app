import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { CreateMateriRequest, MateriWithUploader } from '../types';

type Bindings = { DB: D1Database };

const materi = new Hono<{ Bindings: Bindings }>();

// Get all materi
materi.get('/', async (c) => {
  try {
    const jenis = c.req.query('jenis') || '';
    const jenjang = c.req.query('jenjang') || '';
    const search = c.req.query('search') || '';
    const kategori = c.req.query('kategori') || '';

    let query = `
      SELECT m.*, u.nama as uploader_name
      FROM materi m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (jenis) {
      query += ` AND m.jenis = ?`;
      params.push(jenis);
    }
    if (jenjang) {
      query += ` AND m.jenjang = ?`;
      params.push(jenjang);
    }
    if (kategori) {
      query += ` AND m.kategori LIKE ?`;
      params.push(`%${kategori}%`);
    }
    if (search) {
      query += ` AND (m.judul LIKE ? OR m.deskripsi LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY m.created_at DESC LIMIT 100`;

    const stmt = c.env.DB.prepare(query);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get materi error:', e);
    return Errors.internal(c);
  }
});

// Upload materi
materi.post('/', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const body = await c.req.json() as CreateMateriRequest;

    const validation = validateRequired(body, ['judul']);
    if (!validation.valid) {
      return Errors.validation(c, 'Judul materi harus diisi');
    }

    const { judul, deskripsi, kategori, jenjang, jenis, file_url } = body;

    // Validate jenjang if provided
    if (jenjang && !['SD', 'SMP', 'SMA'].includes(jenjang)) {
      return Errors.validation(c, 'Jenjang tidak valid');
    }

    // Validate jenis if provided
    const validJenis = ['RPP', 'Modul', 'Silabus', 'Media Ajar', 'Soal', 'Lainnya'];
    if (jenis && !validJenis.includes(jenis)) {
      return Errors.validation(c, 'Jenis materi tidak valid');
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO materi (judul, deskripsi, kategori, jenjang, jenis, file_url, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      judul.trim(),
      deskripsi?.trim() || null,
      kategori?.trim() || null,
      jenjang || null,
      jenis || null,
      file_url?.trim() || null,
      user.id
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      judul,
      jenis,
      jenjang
    }, 'Materi berhasil diupload', 201);
  } catch (e: any) {
    console.error('Upload materi error:', e);
    return Errors.internal(c);
  }
});

// Get materi detail
materi.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID materi tidak valid');
    }

    const result: any = await c.env.DB.prepare(`
      SELECT m.*, u.nama as uploader_name
      FROM materi m
      LEFT JOIN users u ON m.uploaded_by = u.id
      WHERE m.id = ?
    `).bind(id).first();

    if (!result) {
      return Errors.notFound(c, 'Materi');
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Get materi detail error:', e);
    return Errors.internal(c);
  }
});

// Increment download count
materi.post('/:id/download', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID materi tidak valid');
    }

    await c.env.DB.prepare(`
      UPDATE materi SET download_count = download_count + 1 WHERE id = ?
    `).bind(id).run();

    return successResponse(c, null, 'Download count updated');
  } catch (e: any) {
    console.error('Update download count error:', e);
    return Errors.internal(c);
  }
});

// Delete materi (owner or admin)
materi.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID materi tidak valid');
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id, uploaded_by FROM materi WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return Errors.notFound(c, 'Materi');
    }

    // Check ownership or admin
    if (existing.uploaded_by !== user.id && user.role !== 'admin') {
      return Errors.forbidden(c, 'Anda tidak memiliki akses untuk menghapus materi ini');
    }

    await c.env.DB.prepare('DELETE FROM materi WHERE id = ?').bind(id).run();

    return successResponse(c, null, 'Materi berhasil dihapus');
  } catch (e: any) {
    console.error('Delete materi error:', e);
    return Errors.internal(c);
  }
});

export default materi;
