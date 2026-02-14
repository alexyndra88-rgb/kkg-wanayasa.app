// Standardized API Response Utilities
// Ensures consistent response format across all endpoints

/**
 * Standard API Response Format
 */
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        hasMore?: boolean;
    };
}

/**
 * Success response helper
 */
export function successResponse<T>(
    c: any,
    data: T,
    message?: string,
    statusCode: number = 200
) {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };
    if (message) response.message = message;
    return c.json(response, statusCode);
}

/**
 * Paginated success response helper
 */
export function paginatedResponse<T>(
    c: any,
    data: T[],
    meta: { page: number; limit: number; total: number }
) {
    const response: ApiResponse<T[]> = {
        success: true,
        data,
        meta: {
            ...meta,
            hasMore: meta.page * meta.limit < meta.total
        }
    };
    return c.json(response);
}

/**
 * Error codes enum
 */
export const ErrorCodes = {
    // Authentication errors (401)
    UNAUTHORIZED: 'UNAUTHORIZED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

    // Authorization errors (403)
    FORBIDDEN: 'FORBIDDEN',
    CSRF_INVALID: 'CSRF_INVALID',

    // Validation errors (400)
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_FIELD: 'MISSING_FIELD',
    INVALID_EMAIL: 'INVALID_EMAIL',
    WEAK_PASSWORD: 'WEAK_PASSWORD',
    EMAIL_EXISTS: 'EMAIL_EXISTS',

    // Not found errors (404)
    NOT_FOUND: 'NOT_FOUND',
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

    // Rate limiting (429)
    RATE_LIMITED: 'RATE_LIMITED',

    // Server errors (500)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
    AI_ERROR: 'AI_ERROR',

    // Config errors
    CONFIG_ERROR: 'CONFIG_ERROR',
    API_KEY_MISSING: 'API_KEY_MISSING',

    // Token errors
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Duplicate error (409)
    DUPLICATE: 'DUPLICATE',
} as const;

/**
 * Error response helper
 */
export function errorResponse(
    c: any,
    code: string,
    message: string,
    statusCode: number = 400,
    details?: any
) {
    const response: ApiResponse = {
        success: false,
        error: {
            code,
            message,
            ...(details && { details })
        }
    };
    return c.json(response, statusCode);
}

/**
 * Common error responses
 */
export const Errors = {
    unauthorized: (c: any, message = 'Silakan login terlebih dahulu') =>
        errorResponse(c, ErrorCodes.UNAUTHORIZED, message, 401),

    forbidden: (c: any, message = 'Anda tidak memiliki akses') =>
        errorResponse(c, ErrorCodes.FORBIDDEN, message, 403),

    notFound: (c: any, resource = 'Data') =>
        errorResponse(c, ErrorCodes.NOT_FOUND, `${resource} tidak ditemukan`, 404),

    conflict: (c: any, message = 'Data sudah ada') =>
        errorResponse(c, ErrorCodes.DUPLICATE, message, 409),

    validation: (c: any, message: string, details?: any) =>
        errorResponse(c, ErrorCodes.VALIDATION_ERROR, message, 400, details),

    badRequest: (c: any, message = 'Permintaan tidak valid') =>
        errorResponse(c, ErrorCodes.INVALID_INPUT, message, 400),

    rateLimited: (c: any, retryAfter: number) =>
        errorResponse(c, ErrorCodes.RATE_LIMITED, 'Terlalu banyak permintaan', 429, { retryAfter }),

    internal: (c: any, message = 'Terjadi kesalahan internal') =>
        errorResponse(c, ErrorCodes.INTERNAL_ERROR, message, 500),

    configError: (c: any, message: string) =>
        errorResponse(c, ErrorCodes.CONFIG_ERROR, message, 500),
};

/**
 * Async handler wrapper with error catching
 */
export function asyncHandler(handler: (c: any) => Promise<Response>) {
    return async (c: any) => {
        try {
            return await handler(c);
        } catch (error: any) {
            // Log error (console is available in Workers)
            // eslint-disable-next-line no-console
            console.error('Unhandled error:', error);

            // Don't expose internal errors
            return Errors.internal(c);
        }
    };
}

/**
 * Validate required fields
 */
export function validateRequired(
    data: Record<string, any>,
    fields: string[]
): { valid: boolean; missing: string[] } {
    const missing = fields.filter(field => {
        const value = data[field];
        // Consider 0 and false as valid values
        if (value === 0 || value === false) return false;
        // Treat null, undefined, and empty string as missing
        return !value;
    });
    return {
        valid: missing.length === 0,
        missing
    };
}
