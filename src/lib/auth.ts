// Auth utilities for password hashing and session management
// Using PBKDF2 with salt for secure password hashing

const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;

/**
 * Hash password using PBKDF2 with random salt
 * Format: salt:hash (both hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();

  // Generate random salt
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH
  );

  // Convert to hex strings
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify password against stored hash
 * Supports both new format (salt:hash) and legacy format (plain SHA-256)
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // Check if legacy format (no colon = plain SHA-256)
  if (!storedHash.includes(':')) {
    // Legacy verification for backwards compatibility
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const legacyHash = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return legacyHash === storedHash;
  }

  // New format: salt:hash
  const [saltHex, expectedHashHex] = storedHash.split(':');

  // Convert salt from hex to Uint8Array
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  const encoder = new TextEncoder();

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using same parameters
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH
  );

  const computedHashHex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Timing-safe comparison
  return timingSafeEqual(computedHashHex, expectedHashHex);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate cryptographically secure session ID
 */
export function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get session expiry date (7 days from now)
 */
export function getSessionExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}

/**
 * Get current authenticated user from session
 */
export async function getCurrentUser(db: D1Database, sessionId: string | undefined) {
  if (!sessionId) return null;

  const result = await db.prepare(`
    SELECT u.id, u.nama, u.email, u.role, u.nip, u.sekolah, u.mata_pelajaran, u.no_hp, u.foto_url
    FROM sessions s 
    JOIN users u ON s.user_id = u.id 
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();

  return result;
}

/**
 * Parse cookie from header
 */
export function getCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split('=');
    if (key.trim() === name) {
      return valueParts.join('=').trim();
    }
  }
  return undefined;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password minimal 8 karakter' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung huruf' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung angka' };
  }
  return { valid: true, message: '' };
}
