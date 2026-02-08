import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { CreateKegiatanRequest, Kegiatan, AbsensiWithUser } from '../types';

type Bindings = { DB: D1Database };

const absensi = new Hono<{ Bindings: Bindings }>();

// Get all kegiatan
absensi.get('/kegiatan', async (c) => {
  try {
    const results = await c.env.DB.prepare(`
      SELECT k.*, u.nama as created_by_name
      FROM kegiatan k
      LEFT JOIN users u ON k.created_by = u.id
      ORDER BY k.tanggal DESC, k.waktu_mulai DESC
      LIMIT 100
    `).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get kegiatan error:', e);
    return Errors.internal(c);
  }
});

// Create kegiatan (admin only)
absensi.post('/kegiatan', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  if (user.role !== 'admin') {
    return Errors.forbidden(c, 'Hanya admin yang dapat membuat kegiatan');
  }

  try {
    const body = await c.req.json() as CreateKegiatanRequest;

    const validation = validateRequired(body, ['nama_kegiatan', 'tanggal']);
    if (!validation.valid) {
      return Errors.validation(c, `Field berikut harus diisi: ${validation.missing.join(', ')}`);
    }

    const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi } = body;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return Errors.validation(c, 'Format tanggal tidak valid (gunakan YYYY-MM-DD)');
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO kegiatan (nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      nama_kegiatan.trim(),
      tanggal,
      waktu_mulai?.trim() || null,
      waktu_selesai?.trim() || null,
      tempat?.trim() || null,
      deskripsi?.trim() || null,
      user.id
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      nama_kegiatan,
      tanggal
    }, 'Kegiatan berhasil dibuat', 201);
  } catch (e: any) {
    console.error('Create kegiatan error:', e);
    return Errors.internal(c);
  }
});

// Check-in to kegiatan
absensi.post('/checkin', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const { kegiatan_id, keterangan } = await c.req.json();

    if (!kegiatan_id) {
      return Errors.validation(c, 'ID kegiatan harus diisi');
    }

    // Check if kegiatan exists
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id FROM kegiatan WHERE id = ?'
    ).bind(kegiatan_id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Check if already checked in
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM absensi WHERE kegiatan_id = ? AND user_id = ?'
    ).bind(kegiatan_id, user.id).first();

    if (existing) {
      return Errors.validation(c, 'Anda sudah check-in untuk kegiatan ini');
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO absensi (kegiatan_id, user_id, keterangan)
      VALUES (?, ?, ?)
    `).bind(kegiatan_id, user.id, keterangan?.trim() || null).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      waktu_checkin: new Date().toISOString()
    }, 'Check-in berhasil');
  } catch (e: any) {
    console.error('Checkin error:', e);
    return Errors.internal(c);
  }
});

// Get absensi for a kegiatan
absensi.get('/kegiatan/:id/absensi', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    const results = await c.env.DB.prepare(`
      SELECT a.*, u.nama, u.nip, u.sekolah
      FROM absensi a
      JOIN users u ON a.user_id = u.id
      WHERE a.kegiatan_id = ?
      ORDER BY a.waktu_checkin ASC
    `).bind(id).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get absensi error:', e);
    return Errors.internal(c);
  }
});

// Get rekap absensi
absensi.get('/rekap', async (c) => {
  try {
    const results = await c.env.DB.prepare(`
      SELECT 
        u.id, u.nama, u.nip, u.sekolah,
        COUNT(DISTINCT a.kegiatan_id) as total_hadir,
        (SELECT COUNT(*) FROM kegiatan) as total_kegiatan
      FROM users u
      LEFT JOIN absensi a ON u.id = a.user_id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY total_hadir DESC, u.nama ASC
    `).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get rekap error:', e);
    return Errors.internal(c);
  }
});

// Delete kegiatan (admin only)
absensi.delete('/kegiatan/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    await c.env.DB.prepare('DELETE FROM kegiatan WHERE id = ?').bind(id).run();

    return successResponse(c, null, 'Kegiatan berhasil dihapus');
  } catch (e: any) {
    console.error('Delete kegiatan error:', e);
    return Errors.internal(c);
  }
});

export default absensi;
