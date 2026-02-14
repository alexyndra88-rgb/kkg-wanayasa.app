import { Hono } from 'hono';
import { getCurrentUser, getCookie } from '../lib/auth';
import { successResponse, Errors, ErrorCodes } from '../lib/response';
import { logger } from '../lib/logger';
import {
    UPLOAD_CONFIG,
    ALL_ALLOWED_MIME_TYPES,
    generateFileKey,
    formatFileSize,
    isAllowedFileType,
    getFileExtension,
} from '../lib/upload';

import { StorageBindings } from '../lib/storage';

type Bindings = {
    DB: D1Database;
} & StorageBindings;

const files = new Hono<{ Bindings: Bindings }>();

// ============================================
// Upload File
// ============================================
files.post('/upload', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        // Parse multipart form data
        const body: any = await c.req.parseBody();
        const file = body.file as File;

        if (!file) {
            return Errors.validation(c, 'Tidak ada file yang diupload');
        }

        // Use Supabase Storage
        const { uploadFile } = await import('../lib/storage');
        const result = await uploadFile(c.env, file as any, 'uploads');

        if (result.error) {
            console.error('File upload failed:', result.error);
            return Errors.internal(c, result.error || 'Gagal mengupload file');
        }

        return successResponse(c, {
            key: result.path,
            url: result.url,
            filename: file.name,
            size: file.size,
            sizeFormatted: formatFileSize(file.size || 0),
            contentType: file.type
        }, 'File berhasil diupload', 201);


    } catch (e: any) {
        logger.error('File upload error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

// ============================================
// Get File
// ============================================
// ============================================
// Get File
// ============================================
// ============================================
// Get File
// ============================================
files.get('/:key{.+}', async (c) => {
    try {
        const key = c.req.param('key');
        if (!key) return Errors.validation(c, 'File key tidak valid');

        // Supabase Logic
        const { getSupabaseClient } = await import('../lib/storage');
        // Validate credentials existence
        if (!c.env.SUPABASE_URL || !c.env.SUPABASE_KEY) {
            return Errors.configError(c, 'Supabase credentials not configured');
        }

        const supabase = getSupabaseClient(c.env);
        const bucket = c.env.SUPABASE_BUCKET || 'materi-kkg'; // Fallback bucket name

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(key);

        return c.redirect(data.publicUrl);

    } catch (e: any) {
        logger.error('Get file error', e);
        return Errors.internal(c);
    }
});

// ============================================
// Delete File
// ============================================
files.delete('/:key{.+}', async (c) => {
    const sessionId = getCookie(c.req.header('Cookie'), 'session');
    const user: any = await getCurrentUser(c.env.DB, sessionId);

    if (!user) return Errors.unauthorized(c);

    try {
        const key = c.req.param('key');
        if (!key) return Errors.validation(c, 'File key tidak valid');

        const { deleteFile } = await import('../lib/storage');
        const result = await deleteFile(c.env, key);

        if (result.error) return Errors.internal(c, result.error);

        logger.info('File deleted (Supabase)', { userId: user.id, key });
        return successResponse(c, null, 'File berhasil dihapus');

    } catch (e: any) {
        logger.error('Delete file error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

// ============================================
// Get Upload Config (for frontend)
// ============================================
files.get('/config', async (c) => {
    return successResponse(c, {
        maxFileSize: UPLOAD_CONFIG.maxFileSize,
        maxFileSizeFormatted: UPLOAD_CONFIG.maxFileSizeFormatted,
        allowedMimeTypes: ALL_ALLOWED_MIME_TYPES,
        allowedExtensions: {
            ...UPLOAD_CONFIG.allowedExtensions
        },
        isConfigured: !!(c.env.SUPABASE_URL && c.env.SUPABASE_KEY)
    });
});

export default files;
