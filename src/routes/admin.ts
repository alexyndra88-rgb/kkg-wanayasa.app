import { Hono } from 'hono';
import { getCurrentUser, getCookie, hashPassword, validatePassword } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import {
  createAuditLog,
  getAuditLogs,
  getAuditActionTypes,
  getAuditEntityTypes,
  getAuditStats,
  cleanOldAuditLogs,
  formatAuditAction
} from '../lib/audit';

import type { DashboardStats, Settings } from '../types';


type Bindings = { DB: D1Database };
type Variables = { user: any };

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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
    // Get all relevant settings
    const settingsKeys = [
      'mistral_api_key', 'nama_ketua', 'tahun_ajaran', 'alamat_sekretariat',
      // New KKG Profile fields
      'nama_kkg', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos',
      'email_kkg', 'telepon_kkg', 'website_kkg',
      'logo_url', 'kop_surat_url',
      'nama_sekretaris', 'nama_bendahara',
      'struktur_organisasi', 'visi_misi',
      'npsn_sekolah_induk', 'nama_sekolah_induk'
    ];

    const placeholders = settingsKeys.map(() => '?').join(',');
    const result = await c.env.DB.prepare(
      `SELECT key, value FROM settings WHERE key IN (${placeholders})`
    ).bind(...settingsKeys).all();

    const settings: any = {};
    result.results?.forEach((row: any) => {
      settings[row.key] = row.value;
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
    const currentUser: any = c.get('user');

    // All updatable settings
    const allowedKeys = [
      'nama_ketua', 'nip_ketua', 'tahun_ajaran', 'alamat_sekretariat',
      'nama_kkg', 'gugus', 'kecamatan', 'kabupaten', 'provinsi', 'kode_pos',
      'email_kkg', 'telepon_kkg', 'website_kkg',
      'logo_url', 'kop_surat_url',
      'nama_sekretaris', 'nama_bendahara',
      'struktur_organisasi', 'visi_misi',
      'npsn_sekolah_induk', 'nama_sekolah_induk'
    ];

    const updates: { key: string; value: string }[] = [];

    // Collect all valid updates
    for (const key of allowedKeys) {
      if (body[key] !== undefined) {
        updates.push({ key, value: body[key] || '' });
      }
    }

    // Handle API key separately (only if not masked)
    if (body.mistral_api_key && !body.mistral_api_key.includes('****')) {
      updates.push({ key: 'mistral_api_key', value: body.mistral_api_key });
    }

    // Execute updates
    for (const { key, value } of updates) {
      await c.env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
      `).bind(key, value, value).run();
    }

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'SETTINGS_UPDATE',
      details: { updated_keys: updates.map(u => u.key) },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, null, 'Pengaturan berhasil disimpan');
  } catch (e: any) {
    console.error('Update settings error:', e);
    return Errors.internal(c);
  }
});

// Upload KKG Logo
// Upload KKG Logo
admin.post('/settings/logo', async (c) => {
  try {
    const currentUser: any = c.get('user');
    const contentType = c.req.header('Content-Type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return Errors.validation(c, 'Content-Type harus multipart/form-data');
    }

    let file: File | undefined;
    try {
      const body = await c.req.parseBody();
      file = body['logo'] as File;
    } catch (e) {
      console.error('Body parsing error:', e);
      return Errors.validation(c, 'Gagal membaca file upload. Mungkin ukuran file terlalu besar.');
    }

    if (!file || typeof file === 'string') {
      return Errors.validation(c, 'File logo tidak valid');
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return Errors.validation(c, 'Tipe file tidak didukung. Gunakan PNG, JPEG, GIF, atau WebP');
    }

    // Supabase Upload Logic
    const { uploadFile } = await import('../lib/storage');
    // Using explicit cast to any for env to satisfy StorageBindings check inside uploadFile if needed, 
    // or better, validate env first. But uploadFile does check env.

    // Check file size for Supabase (e.g. 2MB limit same as before)
    if (file.size > 2 * 1024 * 1024) {
      return Errors.validation(c, 'Ukuran file maksimal 2MB');
    }

    const result = await uploadFile(c.env as any, file, 'logos');

    if (result.error) {
      console.error('Supabase upload error:', result.error);

      // Fallback to DB if Supabase fails? 
      // No, user specifically said they use Supabase and NOT R2. 
      // If Supabase is not configured, we should error out or maybe fallback to DB if absolutely necessary but let's stick to Supabase first as requested.
      // Actually, for small files (logos), DB fallback is still useful for dev/quickstart without config.
      // But user request "cek secara mendalam bagian mana yang masih berhubungan dengan R2" implies they want R2 GONE.

      return Errors.internal(c, 'Gagal mengupload logo ke Supabase: ' + result.error);
    }

    const logoUrl = result.url;

    await c.env.DB.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES ('logo_url', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')
    `).bind(logoUrl, logoUrl).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'SETTINGS_UPDATE',
      details: { action: 'upload_logo', file_name: file.name, storage: 'supabase' },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { logo_url: logoUrl }, 'Logo berhasil diupload');

  } catch (e: any) {
    console.error('Upload logo error:', e);
    return Errors.internal(c, 'Gagal mengupload logo: ' + e.message);
  }
});

// Create new user (admin only)
admin.post('/users', async (c) => {
  try {
    const body = await c.req.json();
    const currentUser: any = c.get('user');
    const { nama, email, password, role = 'user', sekolah, nip } = body;

    const validation = validateRequired(body, ['nama', 'email', 'password']);
    if (!validation.valid) {
      return Errors.validation(c, `Field berikut harus diisi: ${validation.missing.join(', ')}`);
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Errors.validation(c, 'Format email tidak valid');
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return Errors.validation(c, passwordValidation.message);
    }

    // Check if email exists
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return Errors.conflict(c, 'Email sudah terdaftar');
    }

    const passwordHash = await hashPassword(password);

    const result = await c.env.DB.prepare(`
      INSERT INTO users (nama, email, password_hash, role, sekolah, nip, is_approved, approved_at, approved_by)
      VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), ?)
    `).bind(
      nama,
      email.toLowerCase(),
      passwordHash,
      role,
      sekolah || null,
      nip || null,
      currentUser.id
    ).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_CREATE',
      entity_type: 'user',
      entity_id: result.meta.last_row_id,
      details: { name: nama, email, role },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { id: result.meta.last_row_id }, 'User berhasil dibuat', 201);
  } catch (e: any) {
    console.error('Create user error:', e);
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

// Update user details
admin.put('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { nama, sekolah, email, role } = await c.req.json();
    const currentUser: any = c.get('user');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Check user exists
    const user: any = await c.env.DB.prepare(
      'SELECT id, role FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Prevent demoting last admin
    if (user.role === 'admin' && role === 'user') {
      const adminCount: any = await c.env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin'"
      ).first();

      if (adminCount.cnt <= 1) {
        return Errors.validation(c, 'Tidak dapat mengubah role admin terakhir');
      }
    }

    const updates: any[] = [];
    let query = 'UPDATE users SET updated_at = datetime("now")';

    if (nama) { query += ', nama = ?'; updates.push(nama); }
    if (sekolah) { query += ', sekolah = ?'; updates.push(sekolah); }
    if (email) { query += ', email = ?'; updates.push(email); }
    if (role && ['admin', 'user'].includes(role)) { query += ', role = ?'; updates.push(role); }

    query += ' WHERE id = ?';
    updates.push(id);

    await c.env.DB.prepare(query).bind(...updates).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_PROFILE_UPDATE',
      entity_type: 'user',
      entity_id: Number(id),
      details: { updated_user_id: id, updates: { nama, sekolah, email, role } },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, null, 'Data user berhasil diperbarui');
  } catch (e: any) {
    console.error('Update user error:', e);
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

    // Log the action
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_DELETE',
      entity_type: 'user',
      entity_id: Number(id),
      details: { deleted_user_id: id },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, null, 'User berhasil dihapus');
  } catch (e: any) {
    console.error('Delete user error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// Audit Log Endpoints
// ============================================

// Get audit logs with filtering
admin.get('/logs', async (c) => {
  try {
    const userId = c.req.query('user_id');
    const action = c.req.query('action');
    const entityType = c.req.query('entity_type');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const search = c.req.query('search');
    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '50', 10);
    const offset = (page - 1) * limit;

    const { logs, total } = await getAuditLogs(c.env.DB, {
      userId: userId ? parseInt(userId, 10) : undefined,
      action: action || undefined,
      entityType: entityType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: search || undefined,
      limit,
      offset
    });

    return successResponse(c, {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e: any) {
    console.error('Get audit logs error:', e);
    return Errors.internal(c);
  }
});

// Get audit log statistics
admin.get('/logs/stats', async (c) => {
  try {
    const stats = await getAuditStats(c.env.DB);
    return successResponse(c, stats);
  } catch (e: any) {
    console.error('Get audit stats error:', e);
    return Errors.internal(c);
  }
});

// Get available action types for filtering
admin.get('/logs/actions', async (c) => {
  try {
    const actions = await getAuditActionTypes(c.env.DB);
    return successResponse(c, actions.map(action => ({
      value: action,
      label: formatAuditAction(action)
    })));
  } catch (e: any) {
    console.error('Get audit actions error:', e);
    return Errors.internal(c);
  }
});

// Get available entity types for filtering
admin.get('/logs/entities', async (c) => {
  try {
    const entities = await getAuditEntityTypes(c.env.DB);
    return successResponse(c, entities);
  } catch (e: any) {
    console.error('Get audit entities error:', e);
    return Errors.internal(c);
  }
});

// Clean old audit logs (retention)
admin.post('/logs/cleanup', async (c) => {
  try {
    const { days_to_keep = 90 } = await c.req.json();
    const deleted = await cleanOldAuditLogs(c.env.DB, days_to_keep);

    const currentUser: any = c.get('user');
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'ADMIN_ACTION',
      details: { action: 'cleanup_audit_logs', days_to_keep, deleted_count: deleted },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { deleted }, `${deleted} log lama berhasil dihapus`);
  } catch (e: any) {
    console.error('Cleanup audit logs error:', e);
    return Errors.internal(c);
  }
});

// ============================================
// User Approval System
// ============================================

// Get pending users
admin.get('/users/pending', async (c) => {
  try {
    const results = await c.env.DB.prepare(`
      SELECT id, nama, email, nip, sekolah, role, created_at
      FROM users
      WHERE is_approved = 0 OR is_approved IS NULL
      ORDER BY created_at DESC
    `).all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get pending users error:', e);
    return Errors.internal(c);
  }
});

// Approve user
admin.post('/users/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser: any = c.get('user');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Check if user exists and is pending
    const user: any = await c.env.DB.prepare(
      'SELECT id, nama, email, is_approved FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    if (user.is_approved === 1) {
      return Errors.validation(c, 'User sudah disetujui sebelumnya');
    }

    // Approve user
    await c.env.DB.prepare(`
      UPDATE users 
      SET is_approved = 1, approved_at = datetime('now'), approved_by = ?
      WHERE id = ?
    `).bind(currentUser.id, id).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_APPROVE',
      entity_type: 'users',
      entity_id: Number(id),
      details: { approved_user: user.nama, email: user.email },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { approved: true }, `User ${user.nama} berhasil disetujui`);
  } catch (e: any) {
    console.error('Approve user error:', e);
    return Errors.internal(c);
  }
});

// Reject user (delete)
admin.post('/users/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    const { reason } = await c.req.json();
    const currentUser: any = c.get('user');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    // Check if user exists
    const user: any = await c.env.DB.prepare(
      'SELECT id, nama, email FROM users WHERE id = ?'
    ).bind(id).first();

    if (!user) {
      return Errors.notFound(c, 'User');
    }

    // Can't reject admin
    const userDetail: any = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    ).bind(id).first();

    if (userDetail?.role === 'admin') {
      return Errors.forbidden(c, 'Tidak dapat menolak user admin');
    }

    // Delete user
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_REJECT',
      entity_type: 'users',
      entity_id: Number(id),
      details: { rejected_user: user.nama, email: user.email, reason },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { rejected: true }, `User ${user.nama} berhasil ditolak`);
  } catch (e: any) {
    console.error('Reject user error:', e);
    return Errors.internal(c);
  }
});

// Bulk approve users
admin.post('/users/bulk-approve', async (c) => {
  try {
    const { user_ids } = await c.req.json();
    const currentUser: any = c.get('user');

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return Errors.validation(c, 'Daftar user ID harus diisi');
    }

    let approved = 0;
    for (const userId of user_ids) {
      try {
        await c.env.DB.prepare(`
          UPDATE users 
          SET is_approved = 1, approved_at = datetime('now'), approved_by = ?
          WHERE id = ? AND (is_approved = 0 OR is_approved IS NULL)
        `).bind(currentUser.id, userId).run();
        approved++;
      } catch (e) {
        console.warn(`Failed to approve user ${userId}:`, e);
      }
    }

    // Audit log
    await createAuditLog(c.env.DB, {
      user_id: currentUser.id,
      action: 'USER_BULK_APPROVE',
      details: { approved_count: approved, user_ids },
      ip_address: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
      user_agent: c.req.header('User-Agent')
    });

    return successResponse(c, { approved }, `${approved} user berhasil disetujui`);
  } catch (e: any) {
    console.error('Bulk approve error:', e);
    return Errors.internal(c);
  }
});

// Get user approval stats
admin.get('/users/approval-stats', async (c) => {
  try {
    const stats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_approved = 1 THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN is_approved = 0 OR is_approved IS NULL THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN DATE(created_at) = DATE('now') THEN 1 ELSE 0 END) as registered_today
      FROM users
    `).first();

    return successResponse(c, stats);
  } catch (e: any) {
    console.error('Get approval stats error:', e);
    return Errors.internal(c);
  }
});

export default admin;
