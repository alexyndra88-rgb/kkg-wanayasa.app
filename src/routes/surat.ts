import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { callMistral, buildSuratPrompt } from '../lib/mistral';

type Bindings = { DB: D1Database };

const surat = new Hono<{ Bindings: Bindings }>();

// Generate surat undangan
surat.post('/generate', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  try {
    const body = await c.req.json();
    const { jenis_kegiatan, tanggal_kegiatan, waktu_kegiatan, tempat_kegiatan, agenda, peserta, penanggung_jawab } = body;

    if (!jenis_kegiatan || !tanggal_kegiatan || !waktu_kegiatan || !tempat_kegiatan || !agenda) {
      return c.json({ error: 'Semua field wajib harus diisi' }, 400);
    }

    // Get API key
    const setting: any = await c.env.DB.prepare("SELECT value FROM settings WHERE key = 'mistral_api_key'").first();
    const apiKey = setting?.value;

    if (!apiKey) {
      return c.json({ error: 'API Key Mistral belum dikonfigurasi. Hubungi admin.' }, 400);
    }

    // Generate nomor surat
    const count: any = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM surat_undangan WHERE user_id = ?').bind(user.id).first();
    const nomorSurat = `${String(count.cnt + 1).padStart(3, '0')}/KKG-G3/UND/${new Date().toISOString().slice(0,7).replace('-','/')}`;

    const prompt = buildSuratPrompt({
      jenis_kegiatan,
      tanggal_kegiatan,
      waktu_kegiatan,
      tempat_kegiatan,
      agenda,
      peserta: Array.isArray(peserta) ? peserta.join(', ') : peserta || 'Seluruh anggota KKG Gugus 3 Wanayasa',
      penanggung_jawab: penanggung_jawab || user.nama,
      nomor_surat: nomorSurat,
    });

    const isiSurat = await callMistral(apiKey, prompt);

    // Save to database
    const result = await c.env.DB.prepare(`
      INSERT INTO surat_undangan (user_id, nomor_surat, jenis_kegiatan, tanggal_kegiatan, waktu_kegiatan, tempat_kegiatan, agenda, peserta, penanggung_jawab, isi_surat, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'final')
    `).bind(
      user.id, nomorSurat, jenis_kegiatan, tanggal_kegiatan, waktu_kegiatan,
      tempat_kegiatan, agenda, JSON.stringify(peserta || []),
      penanggung_jawab || user.nama, isiSurat
    ).run();

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        nomor_surat: nomorSurat,
        isi_surat: isiSurat,
        jenis_kegiatan,
        tanggal_kegiatan,
        created_at: new Date().toISOString()
      }
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Get surat history
surat.get('/history', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const results = await c.env.DB.prepare(
    'SELECT id, nomor_surat, jenis_kegiatan, tanggal_kegiatan, tempat_kegiatan, status, created_at FROM surat_undangan WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(user.id).all();

  return c.json({ data: results.results });
});

// Get surat detail
surat.get('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const id = c.req.param('id');
  const result: any = await c.env.DB.prepare(
    'SELECT * FROM surat_undangan WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).first();

  if (!result) return c.json({ error: 'Surat tidak ditemukan' }, 404);

  return c.json({ data: result });
});

// Delete surat
surat.delete('/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM surat_undangan WHERE id = ? AND user_id = ?').bind(id, user.id).run();

  return c.json({ success: true });
});

export default surat;
