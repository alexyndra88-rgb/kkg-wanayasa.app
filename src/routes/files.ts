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
    parseMultipartFormData,
    uploadToR2,
    getFromR2,
    deleteFromR2,
    type R2Bucket
} from '../lib/upload';

type Bindings = {
    DB: D1Database;
    BUCKET?: R2Bucket; // R2 bucket binding (optional for development)
};

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
        // Check if R2 is configured
        if (!c.env.BUCKET) {
            logger.warn('R2 bucket not configured', { userId: user.id });
            return c.json({
                success: false,
                error: {
                    code: ErrorCodes.CONFIG_ERROR,
                    message: 'File storage belum dikonfigurasi. Hubungi administrator.'
                }
            }, 503);
        }

        // Parse multipart form data
        const { files: uploadedFiles, fields } = await parseMultipartFormData(c.req.raw);

        if (uploadedFiles.length === 0) {
            return Errors.validation(c, 'Tidak ada file yang diupload');
        }

        const file = uploadedFiles[0]; // Single file upload
        const extension = getFileExtension(file.filename);

        // Validate file type
        if (!isAllowedFileType(file.contentType, extension)) {
            return c.json({
                success: false,
                error: {
                    code: ErrorCodes.VALIDATION_ERROR,
                    message: `Tipe file tidak didukung. Tipe yang diizinkan: ${UPLOAD_CONFIG.allowedExtensions.document.join(', ')}, ${UPLOAD_CONFIG.allowedExtensions.image.join(', ')}`
                }
            }, 400);
        }

        // Validate file size
        if (file.data.byteLength > UPLOAD_CONFIG.maxFileSize) {
            return c.json({
                success: false,
                error: {
                    code: ErrorCodes.VALIDATION_ERROR,
                    message: `Ukuran file melebihi batas maksimal ${UPLOAD_CONFIG.maxFileSizeFormatted}`
                }
            }, 400);
        }

        // Upload to R2
        const result = await uploadToR2(c.env.BUCKET, file.data, {
            filename: file.filename,
            contentType: file.contentType,
            size: file.data.byteLength,
            userId: user.id
        });

        if (!result.success) {
            logger.error('File upload failed', new Error(result.error || 'Unknown error'), { userId: user.id });
            return c.json({
                success: false,
                error: {
                    code: ErrorCodes.INTERNAL_ERROR,
                    message: result.error || 'Gagal mengupload file'
                }
            }, 500);
        }

        logger.info('File uploaded', {
            userId: user.id,
            key: result.key,
            filename: result.filename,
            size: result.size
        });

        return successResponse(c, {
            key: result.key,
            url: result.url,
            filename: result.filename,
            size: result.size,
            sizeFormatted: formatFileSize(result.size || 0),
            contentType: result.contentType
        }, 'File berhasil diupload', 201);

    } catch (e: any) {
        logger.error('File upload error', e, { userId: user.id });
        return Errors.internal(c);
    }
});

// ============================================
// Get File
// ============================================
files.get('/:key{.+}', async (c) => {
    try {
        const key = c.req.param('key');

        if (!key) {
            return Errors.validation(c, 'File key tidak valid');
        }

        if (!c.env.BUCKET) {
            return Errors.configError(c, 'File storage belum dikonfigurasi');
        }

        const file = await getFromR2(c.env.BUCKET, key);

        if (!file) {
            return Errors.notFound(c, 'File');
        }

        // Set appropriate headers
        const headers = new Headers();
        headers.set('Content-Type', file.metadata.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=31536000');
        headers.set('ETag', file.metadata.httpEtag);

        if (file.metadata.customMetadata?.originalFilename) {
            headers.set('Content-Disposition',
                `inline; filename="${encodeURIComponent(file.metadata.customMetadata.originalFilename)}"`
            );
        }

        return new Response(file.body, { headers });

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

    if (!user) {
        return Errors.unauthorized(c);
    }

    try {
        const key = c.req.param('key');

        if (!key) {
            return Errors.validation(c, 'File key tidak valid');
        }

        if (!c.env.BUCKET) {
            return Errors.configError(c, 'File storage belum dikonfigurasi');
        }

        // Check if file belongs to user (optional - can be enforced by key prefix)
        const keyPrefix = `uploads/${user.id}/`;
        if (!key.startsWith(keyPrefix) && user.role !== 'admin') {
            return Errors.forbidden(c, 'Anda tidak memiliki akses untuk menghapus file ini');
        }

        const deleted = await deleteFromR2(c.env.BUCKET, key);

        if (!deleted) {
            return Errors.notFound(c, 'File');
        }

        logger.info('File deleted', { userId: user.id, key });

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
        isConfigured: !!c.env.BUCKET
    });
});

export default files;
