import { Hono } from 'hono';
import { getCurrentUser, getCookie, hashPassword, validatePassword } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { DashboardStats, Settings } from '../types';

type Bindings = { DB: D1Database };

const admin = new Hono<{ Bindings: Bindings }>();

// Middleware: Check admin role
const requireAdmin = async (c: any, next: () => Promise<void>) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  if (user.role !== 'admin') {
    return Errors.forbidden(c, 'Halaman ini hanya untuk admin');
  }

  c.set('user', user);
  await next();
};

admin.use('/*', requireAdmin);

// Dashboard stats
admin.get('/dashboard', async (c) => {
  try {
    const [guru, surat, proker, kegiatan, materi, pengumuman, threads] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM surat_undangan').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM program_kerja').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM kegiatan').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM materi').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM pengumuman').first(),
      c.env.DB.prepare('SELECT COUNT(*) as cnt FROM forum_threads').first(),
    ]) as any[];

    const stats: DashboardStats = {
      total_guru: guru?.cnt || 0,
      total_surat: surat?.cnt || 0,
      total_proker: proker?.cnt || 0,
      total_kegiatan: kegiatan?.cnt || 0,
      total_materi: materi?.cnt || 0,
      total_pengumuman: pengumuman?.cnt || 0,
      total_threads: threads?.cnt || 0,
    };

    return successResponse(c, stats);
  } catch (e: any) {
    console.error('Get dashboard error:', e);
    return Errors.internal(c);
  }
});

// Get settings
admin.get('/settings', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT key, value FROM settings WHERE key IN ('mistral_api_key', 'nama_ketua', 'tahun_ajaran', 'alamat_sekretariat')"
    ).all();

    const settings: Settings = {};
    result.results?.forEach((row: any) => {
      (settings as any)[row.key] = row.value;
    });

    // Mask API key for security
    if (settings.mistral_api_key) {
      const key = settings.mistral_api_key;
      settings.mistral_api_key = key.length > 8
        ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
        : '****';
    }

    return successResponse(c, settings);
  } catch (e: any) {
    console.error('Get settings error:', e);
    return Errors.internal(c);
  }
});

// Update settings
admin.put('/settings', async (c) => {
  try {
    const body = await c.req.json();
    const { mistral_api_key, nama_ketua, tahun_ajaran, alamat_sekretariat } = body;

    const updates = [
      { key: 'nama_ketua', value: nama_ketua },
      { key: 'tahun_ajaran', value: tahun_ajaran },
      { key: 'alamat_sekretariat', value: alamat_sekretariat },
    ];

    // Only update API key if it's not masked
    if (mistral_api_key && !mistral_api_key.includes('****')) {
      updates.push({ key: 'mistral_api_key', value: mistral_api_key });
    }

    for (const { key, value } of updates) {
      if (value !== undefined) {
        await c.env.DB.prepare(`
          INSERT INTO settings (key, value, updated_at) 
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
        `).bind(key, value || '', value || '').run();
      }
    }

    return successResponse(c, null, 'Pengaturan berhasil disimpan');
  } catch (e: any) {
    console.error('Update settings error:', e);
    return Errors.internal(c);
  }
});

// Get all users
admin.get('/users', async (c) => {
  try {
    const search = c.req.query('search') || '';

    let query = `
      SELECT id, nama, email, role, nip, sekolah, mata_pelajaran, no_hp, created_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (nama LIKE ? OR email LIKE ? OR nip LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY nama ASC LIMIT 200`;

    const stmt = c.env.DB.prepare(query);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get users error:', e);
    return Errors.internal(c);
  }
});

// Reset user password
admin.post('/users/:id/reset-password', async (c) => {
  try {
    const id = c.req.param('id');
    const { new_password } = await c.req.json();

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    if (!new_password) {
      return Errors.validation(c, 'Password baru harus diisi');
    }

    // Validate password strength
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return Errors.validation(c, passwordValidation.message);
    }

    // Check user exists
    const user: any = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Hash and update password
    const newHash = await hashPassword(new_password);
    await c.env.DB.prepare(`
      UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(newHash, id).run();

    // Invalidate all sessions for this user
    await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();

    return successResponse(c, null, 'Password berhasil direset');
  } catch (e: any) {
    console.error('Reset password error:', e);
    return Errors.internal(c);
  }
});

// Delete user (with safeguards)
admin.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Prevent self-deletion
    if (Number(id) === currentUser.id) {
      return Errors.validation(c, 'Anda tidak dapat menghapus akun sendiri');
    }

    const user: any = await c.env.DB.prepare(
      'SELECT id, role FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Prevent deleting last admin
    if (user.role === 'admin') {
      const adminCount: any = await c.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'"
      ).first();

      if (adminCount.cnt <= 1) {
        return Errors.validation(c, 'Tidak dapat menghapus admin terakhir');
      }
    }

    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    return successResponse(c, null, 'User berhasil dihapus');
  } catch (e: any) {
    console.error('Delete user error:', e);
    return Errors.internal(c);
  }
});

export default admin;
