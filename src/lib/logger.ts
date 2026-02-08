/**
 * Structured Logger for KKG Portal
 * Provides consistent logging format for debugging and monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    requestId?: string;
    userId?: number;
    path?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
    duration?: number;
    statusCode?: number;
    [key: string]: any;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

// Log level hierarchy
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Minimum log level - default to 'info' in Cloudflare Workers
const MIN_LOG_LEVEL: LogLevel = 'info';

// Check if we're in development mode
const IS_DEVELOPMENT = true; // Set to false in production build

/**
 * Format log entry as JSON for structured logging
 */
function formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
}

/**
 * Check if log should be output based on level
 */
function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

/**
 * Create a log entry
 */
function createEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };

    if (context && Object.keys(context).length > 0) {
        entry.context = context;
    }

    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
            stack: IS_DEVELOPMENT ? error.stack : undefined,
        };
    }

    return entry;
}

/**
 * Main logger object
 */
export const logger = {
    debug(message: string, context?: LogContext) {
        if (shouldLog('debug')) {
            console.log(formatLog(createEntry('debug', message, context)));
        }
    },

    info(message: string, context?: LogContext) {
        if (shouldLog('info')) {
            console.log(formatLog(createEntry('info', message, context)));
        }
    },

    warn(message: string, context?: LogContext) {
        if (shouldLog('warn')) {
            console.warn(formatLog(createEntry('warn', message, context)));
        }
    },

    error(message: string, error?: Error, context?: LogContext) {
        if (shouldLog('error')) {
            console.error(formatLog(createEntry('error', message, context, error)));
        }
    },

    /**
     * Log HTTP request/response
     */
    request(method: string, path: string, statusCode: number, duration: number, context?: LogContext) {
        const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        const message = `${method} ${path} ${statusCode} ${duration}ms`;

        if (shouldLog(level)) {
            console.log(formatLog(createEntry(level, message, {
                method,
                path,
                statusCode,
                duration,
                ...context,
            })));
        }
    },

    /**
     * Log security event
     */
    security(event: string, context?: LogContext) {
        console.warn(formatLog(createEntry('warn', `[SECURITY] ${event}`, context)));
    },

    /**
     * Log authentication event
     */
    auth(event: 'login' | 'logout' | 'register' | 'password_change' | 'login_failed' | 'forgot_password' | 'reset_password', userId?: number, context?: LogContext) {
        const level: LogLevel = event === 'login_failed' ? 'warn' : 'info';
        console.log(formatLog(createEntry(level, `[AUTH] ${event}`, { userId, ...context })));
    },

    /**
     * Log database operation
     */
    db(operation: string, table: string, duration?: number, context?: LogContext) {
        if (shouldLog('debug')) {
            console.log(formatLog(createEntry('debug', `[DB] ${operation} ${table}`, { duration, ...context })));
        }
    },

    /**
     * Log AI operation
     */
    ai(operation: string, success: boolean, duration?: number, context?: LogContext) {
        const level: LogLevel = success ? 'info' : 'error';
        console.log(formatLog(createEntry(level, `[AI] ${operation}`, { success, duration, ...context })));
    },
};

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Create request context from Hono context
 */
export function createRequestContext(c: any): LogContext {
    const headers = c.req.raw.headers;
    return {
        requestId: c.get('requestId') || generateRequestId(),
        method: c.req.method,
        path: c.req.path,
        ip: headers.get('cf-connecting-ip') ||
            headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            'unknown',
        userAgent: headers.get('user-agent')?.substring(0, 100),
    };
}

/**
 * Logging middleware for Hono
 */
export function loggingMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
        const requestId = generateRequestId();
        c.set('requestId', requestId);

        const start = Date.now();

        try {
            await next();
        } finally {
            const duration = Date.now() - start;
            const status = c.res.status;

            // Only log API requests
            if (c.req.path.startsWith('/api')) {
                logger.request(c.req.method, c.req.path, status, duration, {
                    requestId,
                    userId: c.get('user')?.id,
                });
            }
        }
    };
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
        try {
            await next();
        } catch (error: any) {
            logger.error('Unhandled error', error, createRequestContext(c));
            throw error;
        }
    };
}

export default logger;
