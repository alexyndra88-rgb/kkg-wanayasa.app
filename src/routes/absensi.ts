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

// Check-in to kegiatan with status support
absensi.post('/checkin', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const body = await c.req.json();
    const { kegiatan_id, keterangan, status = 'hadir', latitude, longitude } = body;

    if (!kegiatan_id) {
      return Errors.validation(c, 'ID kegiatan harus diisi');
    }

    // Validate status
    const validStatuses = ['hadir', 'izin', 'sakit'];
    if (!validStatuses.includes(status)) {
      return Errors.validation(c, 'Status tidak valid. Gunakan: hadir, izin, atau sakit');
    }

    // Check if kegiatan exists
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan FROM kegiatan WHERE id = ?'
    ).bind(kegiatan_id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Check if already checked in
    const existing: any = await c.env.DB.prepare(
      'SELECT id, status FROM absensi WHERE kegiatan_id = ? AND user_id = ?'
    ).bind(kegiatan_id, user.id).first();

    if (existing) {
      // Update existing record if status changed
      await c.env.DB.prepare(`
        UPDATE absensi SET status = ?, keterangan = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(status, keterangan?.trim() || null, existing.id).run();

      return successResponse(c, {
        id: existing.id,
        status,
        updated: true
      }, `Status absensi diperbarui menjadi ${status}`);
    }

    // Insert new check-in
    const result = await c.env.DB.prepare(`
      INSERT INTO absensi (kegiatan_id, user_id, keterangan, status, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      kegiatan_id,
      user.id,
      keterangan?.trim() || null,
      status,
      latitude || null,
      longitude || null
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      status,
      waktu_checkin: new Date().toISOString()
    }, status === 'hadir' ? 'Check-in berhasil' : `Status ${status} berhasil dicatat`);
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

// Get rekap absensi with status breakdown
absensi.get('/rekap', async (c) => {
  try {
    // Get optional filters
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = `AND k.tanggal BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    } else if (startDate) {
      dateFilter = `AND k.tanggal >= ?`;
      params.push(startDate);
    } else if (endDate) {
      dateFilter = `AND k.tanggal <= ?`;
      params.push(endDate);
    }

    const results = await c.env.DB.prepare(`
      SELECT 
        u.id, u.nama, u.nip, u.sekolah,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as total_hadir,
        COUNT(CASE WHEN a.status = 'izin' THEN 1 END) as total_izin,
        COUNT(CASE WHEN a.status = 'sakit' THEN 1 END) as total_sakit,
        COUNT(DISTINCT a.kegiatan_id) as total_tercatat,
        (SELECT COUNT(*) FROM kegiatan k WHERE 1=1 ${dateFilter}) as total_kegiatan
      FROM users u
      LEFT JOIN absensi a ON u.id = a.user_id
      LEFT JOIN kegiatan k ON a.kegiatan_id = k.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY total_hadir DESC, u.nama ASC
    `).bind(...params).all();

    // Calculate alpha (tidak hadir tanpa keterangan)
    const dataWithAlpha = results.results?.map((row: any) => ({
      ...row,
      total_alpha: Math.max(0, row.total_kegiatan - row.total_tercatat)
    }));

    return successResponse(c, dataWithAlpha);
  } catch (e: any) {
    console.error('Get rekap error:', e);
    return Errors.internal(c);
  }
});

// Export rekap absensi as CSV
absensi.get('/rekap/export', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const format = c.req.query('format') || 'csv';
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = `AND k.tanggal BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }

    const results = await c.env.DB.prepare(`
      SELECT 
        u.nama, u.nip, u.sekolah,
        COUNT(CASE WHEN a.status = 'hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN a.status = 'izin' THEN 1 END) as izin,
        COUNT(CASE WHEN a.status = 'sakit' THEN 1 END) as sakit,
        COUNT(DISTINCT a.kegiatan_id) as tercatat,
        (SELECT COUNT(*) FROM kegiatan k WHERE 1=1 ${dateFilter}) as total_kegiatan
      FROM users u
      LEFT JOIN absensi a ON u.id = a.user_id
      LEFT JOIN kegiatan k ON a.kegiatan_id = k.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.nama ASC
    `).bind(...params).all();

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Nama', 'NIP', 'Sekolah', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total Kegiatan', 'Persentase'];
      const rows = results.results?.map((r: any) => {
        const alpha = Math.max(0, r.total_kegiatan - r.tercatat);
        const percentage = r.total_kegiatan > 0
          ? ((r.hadir / r.total_kegiatan) * 100).toFixed(1) + '%'
          : '0%';
        return [r.nama, r.nip || '', r.sekolah || '', r.hadir, r.izin, r.sakit, alpha, r.total_kegiatan, percentage].join(',');
      });

      const csv = [headers.join(','), ...(rows || [])].join('\n');

      const dateStr = new Date().toISOString().split('T')[0];

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="rekap_absensi_${dateStr}.csv"`
        }
      });
    }

    // JSON format (for Excel generation on client)
    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Export rekap error:', e);
    return Errors.internal(c);
  }
});

// Get detailed absensi per kegiatan for export
absensi.get('/export/detail', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const results = await c.env.DB.prepare(`
      SELECT 
        k.nama_kegiatan,
        k.tanggal,
        u.nama,
        u.nip,
        u.sekolah,
        a.status,
        a.waktu_checkin,
        a.keterangan
      FROM kegiatan k
      LEFT JOIN absensi a ON k.id = a.kegiatan_id
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY k.tanggal DESC, k.nama_kegiatan, u.nama
    `).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Export detail error:', e);
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

// ============================================
// QR Code Endpoints
// ============================================

// Generate QR code for kegiatan (admin only)
absensi.get('/kegiatan/:id/qr', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user || user.role !== 'admin') {
    return Errors.forbidden(c, 'Hanya admin yang dapat generate QR code');
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID kegiatan tidak valid');
    }

    // Check if kegiatan exists
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan, tanggal FROM kegiatan WHERE id = ?'
    ).bind(id).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Get expiry from query param (default 60 minutes)
    const expiryMinutes = parseInt(c.req.query('expiry') || '60', 10);

    // Import QR code generator
    const { generateSecureToken, generateQRCodePNG } = await import('../lib/qrcode');

    // Generate QR data
    const qrData = await generateSecureToken(Number(id), expiryMinutes);

    // Generate QR code image
    const qrImage = await generateQRCodePNG(qrData, 300);

    return successResponse(c, {
      kegiatan_id: kegiatan.id,
      nama_kegiatan: kegiatan.nama_kegiatan,
      tanggal: kegiatan.tanggal,
      qr_data: qrData,
      qr_image: qrImage,
      expires_in_minutes: expiryMinutes,
      expires_at: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString()
    });
  } catch (e: any) {
    console.error('Generate QR error:', e);
    return Errors.internal(c);
  }
});

// Check-in via QR code scan
absensi.post('/checkin/qr', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const { qr_data, keterangan } = await c.req.json();

    if (!qr_data) {
      return Errors.validation(c, 'QR data tidak boleh kosong');
    }

    // Verify QR code
    const { verifySecureToken } = await import('../lib/qrcode');
    const verification = await verifySecureToken(qr_data);

    if (!verification.valid) {
      return Errors.validation(c, verification.error || 'QR code tidak valid');
    }

    const kegiatanId = verification.kegiatanId!;

    // Check if kegiatan exists
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan FROM kegiatan WHERE id = ?'
    ).bind(kegiatanId).first();

    if (!kegiatan) {
      return Errors.notFound(c, 'Kegiatan');
    }

    // Check if already checked in
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM absensi WHERE kegiatan_id = ? AND user_id = ?'
    ).bind(kegiatanId, user.id).first();

    if (existing) {
      return Errors.validation(c, 'Anda sudah check-in untuk kegiatan ini');
    }

    // Perform check-in
    const result = await c.env.DB.prepare(`
      INSERT INTO absensi (kegiatan_id, user_id, keterangan)
      VALUES (?, ?, ?)
    `).bind(kegiatanId, user.id, keterangan?.trim() || 'Check-in via QR').run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      kegiatan_id: kegiatanId,
      nama_kegiatan: kegiatan.nama_kegiatan,
      waktu_checkin: new Date().toISOString(),
      method: 'qr'
    }, 'Check-in berhasil');
  } catch (e: any) {
    console.error('QR Checkin error:', e);
    return Errors.internal(c);
  }
});

// Verify QR code (for preview before check-in)
absensi.post('/verify-qr', async (c) => {
  try {
    const { qr_data } = await c.req.json();

    if (!qr_data) {
      return Errors.validation(c, 'QR data tidak boleh kosong');
    }

    // Verify QR code
    const { verifySecureToken } = await import('../lib/qrcode');
    const verification = await verifySecureToken(qr_data);

    if (!verification.valid) {
      return successResponse(c, {
        valid: false,
        error: verification.error,
        expired: verification.expired || false
      });
    }

    // Get kegiatan info
    const kegiatan: any = await c.env.DB.prepare(
      'SELECT id, nama_kegiatan, tanggal, waktu_mulai, tempat FROM kegiatan WHERE id = ?'
    ).bind(verification.kegiatanId).first();

    if (!kegiatan) {
      return successResponse(c, {
        valid: false,
        error: 'Kegiatan tidak ditemukan'
      });
    }

    return successResponse(c, {
      valid: true,
      kegiatan: {
        id: kegiatan.id,
        nama_kegiatan: kegiatan.nama_kegiatan,
        tanggal: kegiatan.tanggal,
        waktu_mulai: kegiatan.waktu_mulai,
        tempat: kegiatan.tempat
      }
    });
  } catch (e: any) {
    console.error('Verify QR error:', e);
    return Errors.internal(c);
  }
});

export default absensi;
