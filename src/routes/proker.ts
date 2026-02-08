import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { callMistral, buildProkerPrompt } from '../lib/mistral';
import { rateLimitMiddleware, RATE_LIMITS } from '../lib/ratelimit';
import { successResponse, Errors, validateRequired, ErrorCodes } from '../lib/response';
import type { GenerateProkerRequest, KegiatanProker } from '../types';

type Bindings = { DB: D1Database };

const proker = new Hono<{ Bindings: Bindings }>();

// Generate program kerja (AI endpoint - strict rate limit)
proker.post('/generate', rateLimitMiddleware(RATE_LIMITS.ai), async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const body = await c.req.json() as GenerateProkerRequest;

    // Validate required fields
    const validation = validateRequired(body, ['tahun_ajaran', 'visi', 'misi']);
    if (!validation.valid) {
      return Errors.validation(c, `Field berikut harus diisi: ${validation.missing.join(', ')}`);
    }

    const { tahun_ajaran, visi, misi, kegiatan, analisis_kebutuhan } = body;

    // Validate kegiatan array
    if (!kegiatan || !Array.isArray(kegiatan) || kegiatan.length === 0) {
      return Errors.validation(c, 'Minimal satu kegiatan harus diisi');
    }

    // Get API key from settings
    const setting: any = await c.env.DB.prepare(
      "SELECT value FROM settings WHERE key = 'mistral_api_key'"
    ).first();
    const apiKey = setting?.value;

    if (!apiKey) {
      return Errors.configError(c, 'API Key Mistral belum dikonfigurasi. Hubungi admin untuk mengatur API Key.');
    }

    // Format kegiatan for prompt
    const kegiatanFormatted = kegiatan.map((k: KegiatanProker, i: number) =>
      `${i + 1}. ${k.nama_kegiatan || '-'} | Waktu: ${k.waktu_pelaksanaan || '-'} | PJ: ${k.penanggung_jawab || '-'} | Anggaran: ${k.anggaran || '-'} | Indikator: ${k.indikator || '-'}`
    ).join('\n');

    // Build prompt and call AI
    const prompt = buildProkerPrompt({
      tahun_ajaran,
      visi,
      misi,
      kegiatan: kegiatanFormatted,
      analisis_kebutuhan
    });

    let isiDokumen: string;
    try {
      isiDokumen = await callMistral(apiKey, prompt);
    } catch (aiError: any) {
      console.error('AI Generation error:', aiError);
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.AI_ERROR,
          message: 'Gagal menghasilkan program kerja. Silakan coba lagi.',
          details: aiError.message
        }
      }, 500);
    }

    // Save to database
    const result = await c.env.DB.prepare(`
      INSERT INTO program_kerja 
      (user_id, tahun_ajaran, visi, misi, kegiatan, analisis_kebutuhan, isi_dokumen, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'final')
    `).bind(
      user.id,
      tahun_ajaran,
      visi,
      misi,
      JSON.stringify(kegiatan),
      analisis_kebutuhan || null,
      isiDokumen
    ).run();

    return successResponse(c, {
      id: result.meta.last_row_id,
      tahun_ajaran,
      isi_dokumen: isiDokumen,
      created_at: new Date().toISOString()
    }, 'Program kerja berhasil dibuat', 201);

  } catch (e: any) {
    console.error('Generate proker error:', e);
    return Errors.internal(c);
  }
});

// Get proker history
proker.get('/history', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const results = await c.env.DB.prepare(`
      SELECT id, tahun_ajaran, status, created_at 
      FROM program_kerja 
      WHERE user_id = ? 
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get proker history error:', e);
    return Errors.internal(c);
  }
});

// Get proker detail
proker.get('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID program kerja tidak valid');
    }

    const result: any = await c.env.DB.prepare(`
      SELECT * FROM program_kerja 
      WHERE id = ? AND user_id = ?
    `).bind(id, user.id).first();

    if (!result) {
      return Errors.notFound(c, 'Program kerja');
    }

    // Parse JSON fields
    if (result.kegiatan) {
      try {
        result.kegiatan = JSON.parse(result.kegiatan);
      } catch { }
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Get proker detail error:', e);
    return Errors.internal(c);
  }
});

// Delete proker
proker.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID program kerja tidak valid');
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM program_kerja WHERE id = ? AND user_id = ?'
    ).bind(id, user.id).first();

    if (!existing) {
      return Errors.notFound(c, 'Program kerja');
    }

    await c.env.DB.prepare(
      'DELETE FROM program_kerja WHERE id = ? AND user_id = ?'
    ).bind(id, user.id).run();

    return successResponse(c, null, 'Program kerja berhasil dihapus');
  } catch (e: any) {
    console.error('Delete proker error:', e);
    return Errors.internal(c);
  }
});

export default proker;
