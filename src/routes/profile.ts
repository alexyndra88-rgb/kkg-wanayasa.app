import { Hono } from 'hono';
import { getCurrentUser, getCookie, hashPassword, verifyPassword, validatePassword } from '../lib/auth';
import { successResponse, Errors, validateRequired } from '../lib/response';
import { logger } from '../lib/logger';

type Bindings = { DB: D1Database };

const profile = new Hono<{ Bindings: Bindings }>();

// Get current user profile
profile.get('/', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    // Get full user profile including fields not in session
    try {
        const fullProfile = await c.env.DB.prepare(`
      SELECT id, nama, email, role, nip, nik, mata_pelajaran, sekolah, no_hp, alamat, foto_url, created_at
      FROM users WHERE id = ?
    `).bind(user.id).first();

        return successResponse(c, fullProfile);
    } catch (e: any) {
        logger.error('Get profile error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

// Update user profile
profile.put('/', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const body = await c.req.json();
        const { nama, nip, nik, mata_pelajaran, sekolah, no_hp, alamat } = body;

        if (!nama) {
            return Errors.validation(c, 'Nama tidak boleh kosong');
        }

        await c.env.DB.prepare(`
      UPDATE users 
      SET nama = ?, nip = ?, nik = ?, mata_pelajaran = ?, sekolah = ?, no_hp = ?, alamat = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
            nama.trim(),
            nip?.trim() || null,
            nik?.trim() || null,
            mata_pelajaran?.trim() || null,
            sekolah?.trim() || null,
            no_hp?.trim() || null,
            alamat?.trim() || null,
            user.id
        ).run();

        logger.info('Profile updated', { userId: user.id });

        return successResponse(c, {
            id: user.id,
            nama,
            nip,
            nik,
            mata_pelajaran,
            sekolah,
            no_hp,
            alamat
        }, 'Profil berhasil diperbarui');
    } catch (e: any) {
        logger.error('Update profile error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

// Change password
profile.put('/password', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const body = await c.req.json();
        const { current_password, new_password, confirm_password } = body;

        const validation = validateRequired(body, ['current_password', 'new_password', 'confirm_password']);
        if (!validation.valid) {
            return Errors.validation(c, `Field berikut harus diisi: ${validation.missing.join(', ')}`);
        }

        if (new_password !== confirm_password) {
            return Errors.validation(c, 'Konfirmasi password tidak cocok');
        }

        const passValidation = validatePassword(new_password);
        if (!passValidation.valid) {
            return Errors.validation(c, passValidation.message);
        }

        // Verify current password
        // Need to get password hash from DB first as it's not in session
        const userCreds: any = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first();
        const isValid = await verifyPassword(current_password, userCreds.password_hash);

        if (!isValid) {
            return Errors.validation(c, 'Password saat ini salah');
        }

        // Hash new password
        const newHash = await hashPassword(new_password);

        await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?')
            .bind(newHash, user.id).run();

        logger.info('Password changed', { userId: user.id });

        // Optional: Invalidate other sessions? For now we keep them active.

        return successResponse(c, null, 'Password berhasil diubah');
    } catch (e: any) {
        logger.error('Change password error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

// Update profile photo
profile.post('/photo', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const body = await c.req.json();
        const { photo_url } = body;

        if (!photo_url) {
            return Errors.validation(c, 'URL foto tidak boleh kosong');
        }

        await c.env.DB.prepare('UPDATE users SET foto_url = ?, updated_at = datetime("now") WHERE id = ?')
            .bind(photo_url, user.id).run();

        logger.info('Profile photo updated', { userId: user.id, photo_url });

        return successResponse(c, { photo_url }, 'Foto profil berhasil diperbarui');
    } catch (e: any) {
        logger.error('Update profile photo error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

export default profile;
