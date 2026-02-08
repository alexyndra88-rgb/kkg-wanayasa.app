import { Hono } from 'hono';
import {
  hashPassword,
  verifyPassword,
  generateSessionId,
  getSessionExpiry,
  getCurrentUser,
  getCookie,
  generateCSRFToken
} from '../lib/auth';
import { rateLimitMiddleware, RATE_LIMITS } from '../lib/ratelimit';
import { successResponse, Errors, ErrorCodes } from '../lib/response';
import {
  validate,
  validateBody,
  loginSchema,
  registerSchema,
  changePasswordSchema
} from '../lib/validation';
import { logger } from '../lib/logger';
import type { User, LoginRequest, RegisterRequest } from '../types';

type Bindings = { DB: D1Database };

const auth = new Hono<{ Bindings: Bindings }>();

// ============================================
// Login
// ============================================
auth.post('/login', rateLimitMiddleware(RATE_LIMITS.auth), async (c) => {
  try {
    const body = await c.req.json();

    // Validate input with Zod
    const validation = validate(loginSchema, body);
    if (!validation.success) {
      logger.auth('login_failed', undefined, {
        reason: 'validation_error',
        errors: validation.errors,
        ip: c.req.raw.headers.get('cf-connecting-ip') || 'unknown'
      });
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Data tidak valid',
          details: validation.errors
        }
      }, 400);
    }

    const { email, password } = validation.data;

    // Find user
    const user: any = await c.env.DB.prepare(
      'SELECT id, email, password_hash, nama, role, nip, sekolah, mata_pelajaran, no_hp, foto_url FROM users WHERE email = ?'
    ).bind(email.toLowerCase().trim()).first();

    if (!user) {
      logger.auth('login_failed', undefined, { reason: 'user_not_found', email });
      return Errors.unauthorized(c, 'Email atau password salah');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      logger.auth('login_failed', user.id, { reason: 'invalid_password' });
      return Errors.unauthorized(c, 'Email atau password salah');
    }

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = getSessionExpiry();

    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, user.id, expiresAt).run();

    // Generate CSRF token
    const csrfToken = generateCSRFToken();

    // Set cookies
    const isProduction = c.req.raw.url.startsWith('https://');
    const cookieOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isProduction ? '; Secure' : ''}`;

    c.res.headers.append('Set-Cookie', `session=${sessionId}; ${cookieOptions}`);
    c.res.headers.append('Set-Cookie', `csrf_token=${csrfToken}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isProduction ? '; Secure' : ''}`);

    logger.auth('login', user.id, { email: user.email });

    return successResponse(c, {
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        sekolah: user.sekolah,
        foto_url: user.foto_url,
      }
    }, 'Login berhasil');
  } catch (e: any) {
    logger.error('Login error', e);
    return Errors.internal(c);
  }
});

// ============================================
// Register
// ============================================
auth.post('/register', rateLimitMiddleware(RATE_LIMITS.auth), async (c) => {
  try {
    const body = await c.req.json();

    // Validate input with Zod
    const validation = validate(registerSchema, body);
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

    const { nama, email, password, nip, no_hp, sekolah } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email exists
    const existingUser: any = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();

    if (existingUser) {
      return c.json({
        success: false,
        error: {
          code: ErrorCodes.DUPLICATE,
          message: 'Email sudah terdaftar'
        }
      }, 409);
    }

    // Hash password with PBKDF2
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (nama, email, password_hash, role, nip, no_hp, sekolah)
      VALUES (?, ?, ?, 'user', ?, ?, ?)
    `).bind(
      nama.trim(),
      normalizedEmail,
      passwordHash,
      nip?.trim() || null,
      no_hp?.trim() || null,
      sekolah?.trim() || null
    ).run();

    const userId = result.meta.last_row_id as number;

    // Create session
    const sessionId = generateSessionId();
    const expiresAt = getSessionExpiry();

    await c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).bind(sessionId, userId, expiresAt).run();

    // Generate CSRF token
    const csrfToken = generateCSRFToken();

    // Set cookies
    const isProduction = c.req.raw.url.startsWith('https://');
    const cookieOptions = `Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isProduction ? '; Secure' : ''}`;

    c.res.headers.append('Set-Cookie', `session=${sessionId}; ${cookieOptions}`);
    c.res.headers.append('Set-Cookie', `csrf_token=${csrfToken}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${isProduction ? '; Secure' : ''}`);

    logger.auth('register', userId, { email: normalizedEmail });

    return successResponse(c, {
      user: {
        id: userId,
        nama: nama.trim(),
        email: normalizedEmail,
        role: 'user',
      }
    }, 'Registrasi berhasil', 201);
  } catch (e: any) {
    logger.error('Register error', e);
    return Errors.internal(c);
  }
});

// ============================================
// Logout
// ============================================
auth.post('/logout', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');

    if (sessionId) {
      // Get user before deleting session
      const session: any = await c.env.DB.prepare(
        'SELECT user_id FROM sessions WHERE id = ?'
      ).bind(sessionId).first();

      await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();

      if (session) {
        logger.auth('logout', session.user_id);
      }
    }

    // Clear cookies
    c.res.headers.append('Set-Cookie', 'session=; Path=/; Max-Age=0');
    c.res.headers.append('Set-Cookie', 'csrf_token=; Path=/; Max-Age=0');

    return successResponse(c, null, 'Logout berhasil');
  } catch (e: any) {
    logger.error('Logout error', e);
    return Errors.internal(c);
  }
});

// ============================================
// Get Current User
// ============================================
auth.get('/me', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    if (!sessionId) {
      return Errors.unauthorized(c);
    }

    const user: any = await getCurrentUser(c.env.DB, sessionId);
    if (!user) {
      // Clear invalid session cookie
      c.res.headers.append('Set-Cookie', 'session=; Path=/; Max-Age=0');
      return Errors.unauthorized(c);
    }

    return successResponse(c, {
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nip: user.nip,
        sekolah: user.sekolah,
        mata_pelajaran: user.mata_pelajaran,
        no_hp: user.no_hp,
        foto_url: user.foto_url,
      }
    });
  } catch (e: any) {
    logger.error('Get current user error', e);
    return Errors.internal(c);
  }
});

// ============================================
// Change Password
// ============================================
auth.post('/change-password', async (c) => {
  try {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
      return Errors.unauthorized(c);
    }

    const body = await c.req.json();

    // Validate input with Zod
    const validation = validate(changePasswordSchema, body);
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

    const { current_password, new_password } = validation.data;

    // Get current password hash
    const userData: any = await c.env.DB.prepare(
      'SELECT password_hash FROM users WHERE id = ?'
    ).bind(user.id).first();

    // Verify current password
    const isValid = await verifyPassword(current_password, userData.password_hash);
    if (!isValid) {
      logger.auth('password_change', user.id, { success: false, reason: 'invalid_current_password' });
      return Errors.unauthorized(c, 'Password saat ini tidak benar');
    }

    // Hash new password
    const newHash = await hashPassword(new_password);

    // Update password
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(newHash, user.id).run();

    // Invalidate other sessions
    await c.env.DB.prepare(
      'DELETE FROM sessions WHERE user_id = ? AND id != ?'
    ).bind(user.id, sessionId).run();

    logger.auth('password_change', user.id, { success: true });

    return successResponse(c, null, 'Password berhasil diubah');
  } catch (e: any) {
    logger.error('Change password error', e);
    return Errors.internal(c);
  }
});

export default auth;
