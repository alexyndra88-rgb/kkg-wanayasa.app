import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { callMistral, buildProkerPrompt } from '../lib/mistral';

type Bindings = { DB: D1Database };

const proker = new Hono<{ Bindings: Bindings }>();

// Generate program kerja
proker.post('/generate', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  try {
    const body = await c.req.json();
    const { tahun_ajaran, visi, misi, kegiatan, analisis_kebutuhan } = body;

    if (!tahun_ajaran || !visi || !misi || !kegiatan) {
      return c.json({ error: 'Tahun ajaran, visi, misi, dan kegiatan harus diisi' }, 400);
    }

    const setting: any = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'mistral_api_key'").first();
    const apiKey = setting?.value;

    if (!apiKey) {
      return c.json({ error: 'API Key Mistral belum dikonfigurasi. Hubungi admin.' }, 400);
    }

    // Format kegiatan list
    let kegiatanText = '';
    if (Array.isArray(kegiatan)) {
      kegiatanText = kegiatan.map((k: any, i: number) => 
        `${i+1}. ${k.nama_kegiatan} | Waktu: ${k.waktu_pelaksanaan} | PJ: ${k.penanggung_jawab} | Anggaran: ${k.anggaran || '-'} | Indikator: ${k.indikator || '-'}`
      ).join('\n');
    } else {
      kegiatanText = kegiatan;
    }

    const prompt = buildProkerPrompt({
      tahun_ajaran,
      visi,
      misi,
      kegiatan: kegiatanText,
      analisis_kebutuhan,
    });

    const isiDokumen = await callMistral(apiKey, prompt);

    const result = await c.env.DB.prepare(`
      INSERT INTO program_kerja (user_id, tahun_ajaran, visi, misi, kegiatan, analisis_kebutuhan, isi_dokumen, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'final')
    `).bind(
      user.id, tahun_ajaran, visi, misi,
      JSON.stringify(kegiatan), analisis_kebutuhan || null, isiDokumen
    ).run();

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        tahun_ajaran,
        isi_dokumen: isiDokumen,
        created_at: new Date().toISOString()
      }
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Get proker history
proker.get('/history', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const results = await c.env.DB.prepare(
    'SELECT id, tahun_ajaran, status, created_at FROM program_kerja WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return c.json({ data: results.results });
});

// Get proker detail
proker.get('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const id = c.req.param('id');
  const result: any = await c.env.DB.prepare(
    'SELECT * FROM program_kerja WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first();

  if (!result) return c.json({ error: 'Program kerja tidak ditemukan' }, 404);

  return c.json({ data: result });
});

// Delete proker
proker.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM program_kerja WHERE id = ? AND user_id = ?').bind(id, user.id).run();

  return c.json({ success: true });
});

export default proker;
