import { Hono } from 'hono';
import { hashPassword, verifyPassword, generateSessionId, getSessionExpiry, getCurrentUser, getCookie } from '../lib/auth';

type Bindings = { DB: D1Database };

const auth = new Hono<{ Bindings: Bindings }>();

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ error: 'Email dan password harus diisi' }, 400);
    }

    const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return c.json({ error: 'Email atau password salah' }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Email atau password salah' }, 401);
    }

    const sessionId = generateSessionId();
    const expiresAt = getSessionExpiry();

    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, user.id, expiresAt).run();

    // Set cookie
    c.header('Set-Cookie', `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

    return c.json({
      success: true,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        sekolah: user.sekolah,
      }
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Register
auth.post('/register', async (c) => {
  try {
    const { nama, email, password, nip, sekolah, mata_pelajaran, no_hp } = await c.req.json();
    if (!nama || !email || !password) {
      return c.json({ error: 'Nama, email, dan password harus diisi' }, 400);
    }

    const existing: any = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return c.json({ error: 'Email sudah terdaftar' }, 400);
    }

    const passwordHash = await hashPassword(password);
    const result = await c.env.DB.prepare(
      'INSERT INTO users (nama, email, password_hash, role, nip, sekolah, mata_pelajaran, no_hp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(nama, email, passwordHash, 'user', nip || null, sekolah || null, mata_pelajaran || null, no_hp || null).run();

    const userId = result.meta.last_row_id;
    const sessionId = generateSessionId();
    const expiresAt = getSessionExpiry();

    await c.env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, userId, expiresAt).run();

    c.header('Set-Cookie', `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

    return c.json({
      success: true,
      user: { id: userId, nama, email, role: 'user', sekolah }
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Logout
auth.post('/logout', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  c.header('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0');
  return c.json({ success: true });
});

// Get current user
auth.get('/me', async (c) => {
  const sessionId = getCookie(c.req.header('Cookie'), 'session');
  const user = await getCurrentUser(c.env.DB, sessionId);
  if (!user) {
    return c.json({ user: null });
  }
  return c.json({ user });
});

export default auth;
