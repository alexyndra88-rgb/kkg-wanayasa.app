import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { callMistral, buildSuratPrompt } from '../lib/mistral';
import { rateLimitMiddleware, RATE_LIMITS } from '../lib/ratelimit';
import { successResponse, Errors, ErrorCodes } from '../lib/response';
import { validate, validateId, generateSuratSchema } from '../lib/validation';
import { logger } from '../lib/logger';
import type { SuratUndangan } from '../types';

type Bindings = { DB: D1Database };

const surat = new Hono<{ Bindings: Bindings }>();

// ============================================
// Get Surat Settings (Kop & Signer)
// ============================================
surat.get('/settings', async (c) => {
  try {
    const settings = await c.env.DB.prepare(`
      SELECT key, value FROM settings 
      WHERE key IN ('nama_ketua', 'nip_ketua', 'alamat_sekretariat', 'logo_url', 'kabupaten', 'kecamatan', 'gugus')
    `).all();

    // Transform array to object
    const savedSettings: any = {};
    if (settings.results) {
      settings.results.forEach((s: any) => {
        savedSettings[s.key] = s.value;
      });
    }

    // Defaults
    const defaults = {
      nama_ketua: 'Admin KKG Gugus 3', // Fallback
      nip_ketua: '198501012010011001',
      alamat_sekretariat: 'SDN 1 Wanayasa, Jl. Raya Wanayasa No. 1, Kec. Wanayasa, Kab. Purwakarta',
      kabupaten: 'Purwakarta',
      kecamatan: 'Wanayasa',
      gugus: '03'
    };

    return successResponse(c, { ...defaults, ...savedSettings });
  } catch (e: any) {
    logger.error('Get surat settings error', e);
    return Errors.internal(c);
  }
});

// ============================================
// Generate Surat Undangan (AI)
// ============================================
surat.post('/generate', rateLimitMiddleware(RATE_LIMITS.ai), async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  const startTime = Date.now();

  try {
    const body = await c.req.json();

    // Validate with Zod
    const validation = validate(generateSuratSchema, body);
    if (!validation.success) {
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Data tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const {
      jenis_kegiatan,
      tanggal_kegiatan,
      waktu_kegiatan,
      tempat_kegiatan,
      agenda,
      peserta,
      penanggung_jawab
    } = validation.data;

    // Get API key (from settings or use default)
    const DEFAULT_MISTRAL_API_KEY = 'iPwqC0IHLnwajvYAP7bU8OX1PlDPIy7g';
    const setting: any = await c.env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'mistral_api_key'"
    ).first();
    const apiKey = setting?.value || DEFAULT_MISTRAL_API_KEY;

    // Generate nomor surat
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const count: any = await c.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM surat_undangan WHERE strftime("%Y", created_at) = ?'
    ).bind(String(currentYear)).first();

    const nomorSurat = `${String((count?.cnt || 0) + 1).padStart(3, '0')}/KKG-G3/UND/${currentMonth}/${currentYear}`;

    // Build prompt
    const prompt = buildSuratPrompt({
      jenis_kegiatan,
      tanggal_kegiatan,
      waktu_kegiatan,
      tempat_kegiatan,
      agenda,
      peserta: typeof peserta === 'string' ? peserta : (Array.isArray(peserta) ? peserta.join(', ') : 'Seluruh anggota KKG Gugus 3 Wanayasa'),
      penanggung_jawab: penanggung_jawab || user.nama,
      nomor_surat: nomorSurat,
    });

    // Call AI
    let isiSurat: string;
    try {
      isiSurat = await callMistral(apiKey, prompt);
      logger.ai('generate_surat', true, Date.now() - startTime, { userId: user.id });
    } catch (aiError: any) {
      logger.ai('generate_surat', false, Date.now() - startTime, {
        userId: user.id,
        error: aiError.message
      });
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.AI_ERROR,
          message: 'Gagal menghasilkan surat. Silakan coba lagi.',
        }
      }, 500);
    }

    // Save to database
    const result = await c.env.DB.prepare(`
      INSERT INTO surat_undangan 
      (user_id, nomor_surat, jenis_kegiatan, tanggal_kegiatan, waktu_kegiatan, 
       tempat_kegiatan, agenda, peserta, penanggung_jawab, isi_surat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'final')
    `).bind(
      user.id,
      nomorSurat,
      jenis_kegiatan,
      tanggal_kegiatan,
      waktu_kegiatan,
      tempat_kegiatan,
      agenda,
      JSON.stringify(peserta || []),
      penanggung_jawab || user.nama,
      isiSurat
    ).run();

    logger.info('Surat created', {
      userId: user.id,
      suratId: result.meta.last_row_id,
      nomorSurat
    });

    return successResponse(c, {
      id: result.meta.last_row_id,
      nomor_surat: nomorSurat,
      isi_surat: isiSurat,
      jenis_kegiatan,
      tanggal_kegiatan,
      created_at: new Date().toISOString()
    }, 'Surat undangan berhasil dibuat', 201);

  } catch (e: any) {
    logger.error('Generate surat error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Get Surat History
// ============================================
surat.get('/history', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    const [results, countResult] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, nomor_surat, jenis_kegiatan, tanggal_kegiatan, 
               tempat_kegiatan, status, created_at 
        FROM surat_undangan 
        WHERE user_id = ? 
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(user.id, limit, offset).all(),

      c.env.DB.prepare('SELECT COUNT(*) as total FROM surat_undangan WHERE user_id = ?')
        .bind(user.id).first() as any
    ]);

    return successResponse(c, {
      items: results.results,
      pagination: {
        page,
        limit,
        total: countResult?.total || 0,
        totalPages: Math.ceil((countResult?.total || 0) / limit)
      }
    });
  } catch (e: any) {
    logger.error('Get surat history error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Get Surat Detail
// ============================================
surat.get('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    const result: any = await c.env.DB.prepare(`
      SELECT * FROM surat_undangan 
      WHERE id = ? AND user_id = ?
    `).bind(idValidation.id, user.id).first();

    if (!result) {
      return Errors.notFound(c, 'Surat');
    }

    // Parse peserta JSON
    if (result.peserta) {
      try {
        result.peserta = JSON.parse(result.peserta);
      } catch { }
    }

    return successResponse(c, result);
  } catch (e: any) {
    logger.error('Get surat detail error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Update Surat
// ============================================
surat.put('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    // Check ownership
    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM surat_undangan WHERE id = ? AND user_id = ?'
    ).bind(idValidation.id, user.id).first();

    if (!existing) {
      return Errors.notFound(c, 'Surat');
    }

    const { isi_surat } = await c.req.json();

    if (!isi_surat || typeof isi_surat !== 'string') {
      return Errors.validation(c, 'Isi surat harus diisi');
    }

    await c.env.DB.prepare(`
      UPDATE surat_undangan 
      SET isi_surat = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(isi_surat, idValidation.id, user.id).run();

    logger.info('Surat updated', { userId: user.id, suratId: idValidation.id });

    return successResponse(c, { id: idValidation.id }, 'Surat berhasil diperbarui');
  } catch (e: any) {
    logger.error('Update surat error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Delete Surat
// ============================================
surat.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM surat_undangan WHERE id = ? AND user_id = ?'
    ).bind(idValidation.id, user.id).first();

    if (!existing) {
      return Errors.notFound(c, 'Surat');
    }

    await c.env.DB.prepare(
      'DELETE FROM surat_undangan WHERE id = ? AND user_id = ?'
    ).bind(idValidation.id, user.id).run();

    logger.info('Surat deleted', { userId: user.id, suratId: idValidation.id });

    return successResponse(c, null, 'Surat berhasil dihapus');
  } catch (e: any) {
    logger.error('Delete surat error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

// ============================================
// Download Surat as DOCX
// ============================================
surat.get('/:id/download', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const idValidation = validateId(c.req.param('id'));
    if (!idValidation.valid) {
      return Errors.validation(c, idValidation.message);
    }

    // Get surat data
    const result: any = await c.env.DB.prepare(`
      SELECT * FROM surat_undangan 
      WHERE id = ? AND user_id = ?
    `).bind(idValidation.id, user.id).first();

    if (!result) {
      return Errors.notFound(c, 'Surat');
    }

    // Get KKG settings
    const settingsResult = await c.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('nama_ketua', 'alamat_sekretariat')"
    ).all();

    const settings: any = {};
    settingsResult.results?.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    // Parse peserta JSON
    let peserta = [];
    if (result.peserta) {
      try {
        peserta = JSON.parse(result.peserta);
      } catch { }
    }

    // Import and generate DOCX
    const { generateSuratBuffer } = await import('../lib/docx-generator');

    const buffer = await generateSuratBuffer({
      nomor_surat: result.nomor_surat,
      jenis_kegiatan: result.jenis_kegiatan,
      tanggal_kegiatan: result.tanggal_kegiatan,
      waktu_kegiatan: result.waktu_kegiatan,
      tempat_kegiatan: result.tempat_kegiatan,
      agenda: result.agenda,
      peserta: peserta,
      penanggung_jawab: result.penanggung_jawab,
      isi_surat: result.isi_surat,
      created_at: result.created_at
    }, settings);

    // Generate filename
    const filename = `Surat_Undangan_${result.jenis_kegiatan.replace(/\s+/g, '_')}_${result.nomor_surat.replace(/\//g, '-')}.docx`;

    logger.info('Surat downloaded', { userId: user.id, suratId: idValidation.id });

    // Return as downloadable file
    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (e: any) {
    logger.error('Download surat error', e, { userId: user.id });
    return Errors.internal(c);
  }
});

export default surat;
