// Rate limiting middleware for Cloudflare Workers
// Uses in-memory store with automatic cleanup

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory rate limit store (per worker instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    windowMs: number;      // Time window in milliseconds
    maxRequests: number;   // Max requests per window
    keyPrefix?: string;    // Key prefix for different endpoints
}

/**
 * Default configurations for different endpoint types
 */
export const RATE_LIMITS = {
    // Auth endpoints (increased for dev)
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 50,          // 50 attempts (dev-friendly)
        keyPrefix: 'auth'
    },
    // Strict for AI generation (expensive operations)
    ai: {
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 30,          // 30 requests (increased)
        keyPrefix: 'ai'
    },
    // General API (increased for dev)
    api: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 500,         // 500 requests (dev-friendly)
        keyPrefix: 'api'
    },
    // Lenient for read operations
    read: {
        windowMs: 60 * 1000,      // 1 minute
        maxRequests: 500,         // 500 requests
        keyPrefix: 'read'
    }
};

/**
 * Reset all rate limits (for testing)
 */
export function resetRateLimits(): void {
    rateLimitStore.clear();
}

/**
 * Get client IP from request
 */
function getClientIP(request: Request): string {
    // Cloudflare provides CF-Connecting-IP header
    const cfIP = request.headers.get('CF-Connecting-IP');
    if (cfIP) return cfIP;

    // Fallback to X-Forwarded-For
    const forwarded = request.headers.get('X-Forwarded-For');
    if (forwarded) return forwarded.split(',')[0].trim();

    // Fallback to X-Real-IP
    const realIP = request.headers.get('X-Real-IP');
    if (realIP) return realIP;

    // Default fallback
    return 'unknown';
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

/**
 * Check rate limit for a given key
 * Returns: { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
    ip: string,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter: number } {
    const key = `${config.keyPrefix || 'default'}:${ip}`;
    const now = Date.now();

    // Cleanup occasionally (1% chance per request)
    if (Math.random() < 0.01) {
        cleanupExpiredEntries();
    }

    let entry = rateLimitStore.get(key);

    // If no entry or expired, create new one
    if (!entry || now > entry.resetTime) {
        entry = {
            count: 1,
            resetTime: now + config.windowMs
        };
        rateLimitStore.set(key, entry);
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            resetTime: entry.resetTime,
            retryAfter: 0
        };
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            resetTime: entry.resetTime,
            retryAfter
        };
    }

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
        retryAfter: 0
    };
}

/**
 * Rate limit middleware factory for Hono
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
    return async (c: any, next: () => Promise<void>) => {
        const ip = getClientIP(c.req.raw);
        const result = checkRateLimit(ip, config);

        // Set rate limit headers
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', result.remaining.toString());
        c.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

        if (!result.allowed) {
            c.header('Retry-After', result.retryAfter.toString());
            return c.json({
                error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
                retryAfter: result.retryAfter
            }, 429);
        }

        await next();
    };
}

/**
 * Simple rate limit check (for use inside route handlers)
 */
export function isRateLimited(request: Request, config: RateLimitConfig): boolean {
    const ip = getClientIP(request);
    const result = checkRateLimit(ip, config);
    return !result.allowed;
}
