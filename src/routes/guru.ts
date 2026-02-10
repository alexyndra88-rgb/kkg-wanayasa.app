import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import type { User, UserPublic } from '../types';

type Bindings = { DB: D1Database };

const guru = new Hono<{ Bindings: Bindings }>();

// Get all guru (public)
guru.get('/', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user = await getCurrentUser(c.env.DB, sessionId);
    const isLoggedIn = !!user;

    // Smart Privacy: Hide sensitive data for public users
    const columns = isLoggedIn
      ? "id, nama, email, role, nip, sekolah, mata_pelajaran, no_hp, foto_url"
      : "id, nama, role, sekolah, mata_pelajaran, foto_url"; // No NIP, Email, Phone for public

    let query = `SELECT ${columns} FROM users WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      const searchTerm = `%${search}%`;
      // Public search fields
      let searchConditions = `(nama LIKE ? OR sekolah LIKE ? OR mata_pelajaran LIKE ?`;
      params.push(searchTerm, searchTerm, searchTerm);

      // Authenticated search fields (NIP, Phone)
      if (isLoggedIn) {
        searchConditions += ` OR nip LIKE ? OR no_hp LIKE ?`;
        params.push(searchTerm, searchTerm);
      }

      searchConditions += `)`;
      query += ` AND ${searchConditions}`;
    }

    query += ` ORDER BY nama ASC LIMIT 100`;

    const stmt = c.env.DB.prepare(query);
    const results = params.length > 0
      ? await stmt.bind(...params).all()
      : await stmt.all();

    return successResponse(c, results.results);
  } catch (e: any) {
    console.error('Get guru error:', e);
    return Errors.internal(c);
  }
});

// Get guru by ID
guru.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID guru tidak valid');
    }

    const result: any = await c.env.DB.prepare(`
      SELECT id, nama, email, role, nip, sekolah, mata_pelajaran, no_hp, foto_url, created_at
      FROM users WHERE id = ?
    `).bind(id).first();

    if (!result) {
      return Errors.notFound(c, 'Guru');
    }

    return successResponse(c, result);
  } catch (e: any) {
    console.error('Get guru detail error:', e);
    return Errors.internal(c);
  }
});

// Update profile (self only)
guru.put('/profile', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user: any = await getCurrentUser(c.env.DB, sessionId);

  if (!user) {
    return Errors.unauthorized(c);
  }

  try {
    const { nama, nip, sekolah, mata_pelajaran, no_hp, alamat } = await c.req.json();

    if (!nama || nama.trim().length < 2) {
      return Errors.validation(c, 'Nama minimal 2 karakter');
    }

    await c.env.DB.prepare(`
      UPDATE users 
      SET nama = ?, nip = ?, sekolah = ?, mata_pelajaran = ?, no_hp = ?, alamat = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      nama.trim(),
      nip?.trim() || null,
      sekolah?.trim() || null,
      mata_pelajaran?.trim() || null,
      no_hp?.trim() || null,
      alamat?.trim() || null,
      user.id
    ).run();

    // Get updated user
    const updatedUser: any = await c.env.DB.prepare(`
      SELECT id, nama, email, role, nip, sekolah, mata_pelajaran, no_hp, foto_url
      FROM users WHERE id = ?
    `).bind(user.id).first();

    return successResponse(c, updatedUser, 'Profil berhasil diperbarui');
  } catch (e: any) {
    console.error('Update profile error:', e);
    return Errors.internal(c);
  }
});

// Update user role (admin only)
guru.put('/:id/role', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const currentUser: any = await getCurrentUser(c.env.DB, sessionId);

  if (!currentUser || currentUser.role !== 'admin') {
    return Errors.forbidden(c);
  }

  try {
    const id = c.req.param('id');
    const { role } = await c.req.json();

    if (!id || isNaN(Number(id))) {
      return Errors.validation(c, 'ID user tidak valid');
    }

    if (!['admin', 'user'].includes(role)) {
      return Errors.validation(c, 'Role tidak valid');
    }

    // Prevent self-demotion
    if (Number(id) === currentUser.id && role !== 'admin') {
      return Errors.validation(c, 'Anda tidak dapat menghapus role admin dari diri sendiri');
    }

    const existing: any = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return Errors.notFound(c, 'User');
    }

    await c.env.DB.prepare(`
      UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(role, id).run();

    return successResponse(c, { id, role }, 'Role berhasil diubah');
  } catch (e: any) {
    console.error('Update role error:', e);
    return Errors.internal(c);
  }
});

export default guru;
