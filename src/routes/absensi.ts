import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';

type Bindings = { DB: D1Database };

const absensi = new Hono<{ Bindings: Bindings }>();

// List kegiatan
absensi.get('/kegiatan', async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT k.*, u.nama as created_by_name FROM kegiatan k LEFT JOIN users u ON k.created_by = u.id ORDER BY k.tanggal DESC'
  ).all();
  return c.json({ data: results.results });
});

// Create kegiatan
absensi.post('/kegiatan', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') return c.json({ error: 'Akses ditolak' }, 403);

  const { nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi } = await c.req.json();
  
  const result = await c.env.DB.prepare(
    'INSERT INTO kegiatan (nama_kegiatan, tanggal, waktu_mulai, waktu_selesai, tempat, deskripsi, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(nama_kegiatan, tanggal, waktu_mulai || null, waktu_selesai || null, tempat || null, deskripsi || null, user.id).run();

  return c.json({ success: true, id: result.meta.last_row_id });
});

// Check-in absensi
absensi.post('/checkin', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user) return c.json({ error: 'Silakan login terlebih dahulu' }, 401);

  const { kegiatan_id, keterangan } = await c.req.json();

  try {
    await c.env.DB.prepare(
      'INSERT INTO absensi (kegiatan_id, user_id, keterangan) VALUES (?, ?, ?)'
    ).bind(kegiatan_id, user.id, keterangan || null).run();

    return c.json({ success: true, message: 'Check-in berhasil!' });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      return c.json({ error: 'Anda sudah melakukan check-in untuk kegiatan ini' }, 400);
    }
    return c.json({ error: e.message }, 500);
  }
});

// Get absensi per kegiatan
absensi.get('/kegiatan/:id/absensi', async (c) => {
  const kegiatanId = c.req.param('id');
  const results = await c.env.DB.prepare(`
    SELECT a.*, u.nama, u.nip, u.sekolah, u.mata_pelajaran 
    FROM absensi a JOIN users u ON a.user_id = u.id 
    WHERE a.kegiatan_id = ? ORDER BY a.waktu_checkin ASC
  `).bind(kegiatanId).all();

  return c.json({ data: results.results });
});

// Get rekap absensi user
absensi.get('/rekap', async (c) => {
  const results = await c.env.DB.prepare(`
    SELECT u.id, u.nama, u.nip, u.sekolah, 
      COUNT(a.id) as total_hadir,
      (SELECT COUNT(*) FROM kegiatan) as total_kegiatan
    FROM users u 
    LEFT JOIN absensi a ON u.id = a.user_id
    WHERE u.role != 'admin' OR u.role = 'admin'
    GROUP BY u.id
    ORDER BY u.nama ASC
  `).all();

  return c.json({ data: results.results });
});

// Delete kegiatan
absensi.delete('/kegiatan/:id', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);
  if (!user || user.role !== 'admin') return c.json({ error: 'Akses ditolak' }, 403);

  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM kegiatan WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default absensi;
