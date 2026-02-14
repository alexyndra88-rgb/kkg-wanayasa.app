import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { CreateMateriRequest, MateriWithUploader } from '../types';

import { uploadFile, deleteFile, StorageBindings } from '../lib/storage';

type Bindings = {
  DB: D1Database;
} & StorageBindings;

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
    const body = await c.req.parseBody();

    const judul = body.judul as string;
    const deskripsi = body.deskripsi as string;
    const kategori = body.kategori as string;
    const jenjang = body.jenjang as string;
    const jenis = body.jenis as string;
    const fileUrlInput = body.file_url as string;
    const file = body.file instanceof File ? body.file : null;

    if (!judul) {
      return Errors.validation(c, 'Judul materi harus diisi');
    }

    // Validate jenjang if provided
    const validJenjang = ['SD', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Lainnya'];
    if (jenjang && !validJenjang.includes(jenjang)) {
      return Errors.validation(c, 'Jenjang/Kelas tidak valid');
    }

    // Validate jenis if provided
    const validJenis = ['RPP', 'Modul', 'Silabus', 'Media Ajar', 'Soal', 'Lainnya'];
    if (jenis && !validJenis.includes(jenis)) {
      return Errors.validation(c, 'Jenis materi tidak valid');
    }

    let finalFileUrl: string | null = null;
    let finalFileKey: string | null = null;
    let finalFileName: string | null = null;
    let fileSize: number = 0;

    // 1. Prioritas 1: Upload File Fisik (via Supabase)
    if (file) {
      // Limit size 10MB
      if (file.size > 10 * 1024 * 1024) {
        return Errors.validation(c, 'Ukuran file maksimal 10MB');
      }

      const uploadResult = await uploadFile(c.env, file, 'materi');
      if (uploadResult.error) {
        console.error('Supabase upload failed:', uploadResult.error);
        return Errors.internal(c, `Gagal upload file: ${uploadResult.error}`);
      }

      finalFileUrl = uploadResult.url;
      finalFileKey = uploadResult.path;
      finalFileName = file.name;
      fileSize = file.size;
    }
    // 2. Prioritas 2: External URL (jika tidak ada file fisik)
    else if (fileUrlInput) {
      if (!fileUrlInput.match(/^https?:\/\//)) {
        return Errors.validation(c, 'URL file harus dimulai dengan http:// atau https://');
      }
      finalFileUrl = fileUrlInput;
    }

    // Insert to DB
    const result = await c.env.DB.prepare(`
        INSERT INTO materi (judul, deskripsi, kategori, jenjang, jenis, file_url, file_key, file_name, file_size, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      judul.trim(),
      deskripsi ? deskripsi.trim() : null,
      kategori ? kategori.trim() : null,
      jenjang || null,
      jenis || null,
      finalFileUrl,
      finalFileKey,
      finalFileName,
      fileSize,
      user.id
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      judul,
      file_url: finalFileUrl
    }, 'Materi berhasil diupload', 201);

  } catch (e: any) {
    console.error('Upload materi error:', e);
    return Errors.internal(c, e.message);
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

// Update materi (owner or admin)
materi.put('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');
    let body: any = {};
    try {
      body = await c.req.json();
    } catch (e) {
      body = await c.req.parseBody();
    }

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID materi tidak valid');
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id, uploaded_by FROM materi WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return Errors.notFound(c, 'Materi');
    }

    if (existing.uploaded_by !== user.id && user.role !== 'admin') {
      return Errors.forbidden(c, 'Anda tidak memiliki akses untuk mengedit materi ini');
    }

    const judul = body.judul as string;
    const deskripsi = body.deskripsi as string;
    const kategori = body.kategori as string;
    const jenjang = body.jenjang as string;
    const jenis = body.jenis as string;

    if (!judul) {
      return Errors.validation(c, 'Judul materi harus diisi');
    }

    const validJenjang = ['SD', 'Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Lainnya'];
    if (jenjang && !validJenjang.includes(jenjang)) {
      return Errors.validation(c, 'Jenjang/Kelas tidak valid');
    }

    await c.env.DB.prepare(`
        UPDATE materi 
        SET judul = ?, deskripsi = ?, kategori = ?, jenjang = ?, jenis = ?
        WHERE id = ?
    `).bind(
      judul.trim(),
      deskripsi?.trim() || null,
      kategori?.trim() || null,
      jenjang || null,
      jenis || null,
      id
    ).run();

    return successResponse(c, { id }, 'Materi berhasil diperbarui');
  } catch (e: any) {
    console.error('Update materi error:', e);
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
      'SELECT id, uploaded_by, file_key FROM materi WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return Errors.notFound(c, 'Materi');
    }

    // Check ownership or admin
    if (existing.uploaded_by !== user.id && user.role !== 'admin') {
      return Errors.forbidden(c, 'Anda tidak memiliki akses untuk menghapus materi ini');
    }

    // Delete from storage if key exists
    if (existing.file_key) {
      await deleteFile(c.env, existing.file_key);
    }

    await c.env.DB.prepare('DELETE FROM materi WHERE id = ?').bind(id).run();

    return successResponse(c, null, 'Materi berhasil dihapus');
  } catch (e: any) {
    console.error('Delete materi error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// Rating & Review Endpoints
// ============================================

// Get reviews for a materi
materi.get('/:id/reviews', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID materi tidak valid');
    }

    const results = await c.env.DB.prepare(`
      SELECT r.*, u.nama as user_name
      FROM materi_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.materi_id = ?
      ORDER BY r.created_at DESC
    `).bind(id).all();

    // Get summary stats
    const stats = await c.env.DB.prepare(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
      FROM materi_reviews WHERE materi_id = ?
    `).bind(id).first();

    return successResponse(c, {
      reviews: results.results,
      stats: {
        avgRating: Math.round((stats as any)?.avg_rating * 10) / 10 || 0,
        totalReviews: (stats as any)?.total_reviews || 0,
        distribution: {
          5: (stats as any)?.stars_5 || 0,
          4: (stats as any)?.stars_4 || 0,
          3: (stats as any)?.stars_3 || 0,
          2: (stats as any)?.stars_2 || 0,
          1: (stats as any)?.stars_1 || 0
        }
      }
    });
  } catch (e: any) {
    console.error('Get reviews error:', e);
    return Errors.internal(c);
  }
});

// Add or update review
materi.post('/:id/reviews', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');
    const { rating, komentar } = await c.req.json();

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID materi tidak valid');
    }

    if (!rating || rating < 1 || rating > 5) {
      return Errors.validation(c, 'Rating harus antara 1-5');
    }

    // Check if materi exists
    const materi = await c.env.DB.prepare('SELECT id FROM materi WHERE id = ?').bind(id).first();
    if (!materi) {
      return Errors.notFound(c, 'Materi');
    }

    // Check if user already reviewed
    const existing = await c.env.DB.prepare(
      'SELECT id FROM materi_reviews WHERE materi_id = ? AND user_id = ?'
    ).bind(id, user.id).first();

    if (existing) {
      // Update existing review
      await c.env.DB.prepare(`
        UPDATE materi_reviews 
        SET rating = ?, komentar = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(rating, komentar?.trim() || null, (existing as any).id).run();

      return successResponse(c, { updated: true }, 'Review berhasil diperbarui');
    }

    // Insert new review
    const result = await c.env.DB.prepare(`
      INSERT INTO materi_reviews (materi_id, user_id, rating, komentar)
      VALUES (?, ?, ?, ?)
    `).bind(id, user.id, rating, komentar?.trim() || null).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      rating,
      komentar
    }, 'Review berhasil ditambahkan', 201);
  } catch (e: any) {
    console.error('Add review error:', e);
    return Errors.internal(c);
  }
});

// Delete review
materi.delete('/:id/reviews', async (c) => {
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

    // Delete user's own review
    await c.env.DB.prepare(
      'DELETE FROM materi_reviews WHERE materi_id = ? AND user_id = ?'
    ).bind(id, user.id).run();

    return successResponse(c, null, 'Review berhasil dihapus');
  } catch (e: any) {
    console.error('Delete review error:', e);
    return Errors.internal(c);
  }
});

// Get user's review for a materi
materi.get('/:id/my-review', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');

    const review = await c.env.DB.prepare(
      'SELECT * FROM materi_reviews WHERE materi_id = ? AND user_id = ?'
    ).bind(id, user.id).first();

    return successResponse(c, review || null);
  } catch (e: any) {
    console.error('Get my review error:', e);
    return Errors.internal(c);
  }
});

export default materi;
