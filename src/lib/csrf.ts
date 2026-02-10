// CSRF Protection Middleware
// Uses double-submit cookie pattern

import { generateCSRFToken, getCookie } from './auth';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_EXPIRY_SECONDS = 60 * 60 * 24; // 24 hours

// Paths that should be excluded from CSRF protection (auth-related endpoints)
const CSRF_IGNORE_PATHS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/health',
    '/api/init-db',
    '/api/admin/settings/logo', // File upload uses FormData
    '/api/files/upload', // File upload uses FormData
];

/**
 * Generate and set CSRF token cookie
 */
export function setCSRFCookie(c: any): string {
    const token = generateCSRFToken();
    c.header(
        'Set-Cookie',
        `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly=false; SameSite=Strict; Max-Age=${CSRF_EXPIRY_SECONDS}`
    );
    return token;
}

/**
 * Check if a path should be ignored for CSRF validation
 */
function shouldIgnorePath(path: string): boolean {
    return CSRF_IGNORE_PATHS.some(ignorePath => {
        if (ignorePath.endsWith('*')) {
            return path.startsWith(ignorePath.slice(0, -1));
        }
        return path === ignorePath || path.startsWith(ignorePath + '/');
    });
}

/**
 * CSRF protection middleware for Hono
 * Should be applied to all state-changing routes (POST, PUT, DELETE, PATCH)
 */
export function csrfMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
        const method = c.req.method.toUpperCase();
        const path = new URL(c.req.url).pathname;

        // Skip for safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            await next();
            return;
        }

        // Skip for ignored paths (auth endpoints, etc.)
        if (shouldIgnorePath(path)) {
            await next();
            return;
        }

        // Get token from cookie
        const cookieHeader = c.req.header('Cookie');
        const cookieToken = getCookie(cookieHeader, CSRF_COOKIE_NAME);

        // Get token from header
        const headerToken = c.req.header(CSRF_HEADER_NAME);

        // Validate tokens exist and match
        if (!cookieToken || !headerToken) {
            return c.json({
                success: false,
                error: {
                    message: 'CSRF token tidak ditemukan',
                    code: 'CSRF_MISSING'
                }
            }, 403);
        }

        if (cookieToken !== headerToken) {
            return c.json({
                success: false,
                error: {
                    message: 'CSRF token tidak valid',
                    code: 'CSRF_INVALID'
                }
            }, 403);
        }

        await next();
    };
}

/**
 * Get or create CSRF token
 */
export function getOrCreateCSRFToken(c: any): string {
    const cookieHeader = c.req.header('Cookie');
    const existingToken = getCookie(cookieHeader, CSRF_COOKIE_NAME);

    if (existingToken) {
        return existingToken;
    }

    return setCSRFCookie(c);
}
