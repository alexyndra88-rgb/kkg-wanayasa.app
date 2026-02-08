/**
 * File Upload Module for KKG Portal
 * Supports Cloudflare R2 for production and local storage for development
 */

import { z } from 'zod';

// ============================================
// Configuration
// ============================================

export const UPLOAD_CONFIG = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFileSizeFormatted: '10MB',
    allowedMimeTypes: {
        document: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        image: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ],
        archive: [
            'application/zip',
            'application/x-rar-compressed',
        ],
    },
    allowedExtensions: {
        document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
        image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        archive: ['.zip', '.rar'],
    },
};

// Combine all allowed types
export const ALL_ALLOWED_MIME_TYPES = [
    ...UPLOAD_CONFIG.allowedMimeTypes.document,
    ...UPLOAD_CONFIG.allowedMimeTypes.image,
    ...UPLOAD_CONFIG.allowedMimeTypes.archive,
];

export const ALL_ALLOWED_EXTENSIONS = [
    ...UPLOAD_CONFIG.allowedExtensions.document,
    ...UPLOAD_CONFIG.allowedExtensions.image,
    ...UPLOAD_CONFIG.allowedExtensions.archive,
];

// ============================================
// Validation Schemas
// ============================================

export const fileUploadSchema = z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().refine(
        (type) => ALL_ALLOWED_MIME_TYPES.includes(type),
        { message: 'Tipe file tidak didukung' }
    ),
    size: z.number().max(UPLOAD_CONFIG.maxFileSize,
        `Ukuran file maksimal ${UPLOAD_CONFIG.maxFileSizeFormatted}`
    ),
});

// ============================================
// Types
// ============================================

export interface UploadResult {
    success: boolean;
    url?: string;
    key?: string;
    filename?: string;
    size?: number;
    contentType?: string;
    error?: string;
}

export interface FileMetadata {
    key: string;
    filename: string;
    contentType: string;
    size: number;
    uploadedAt: string;
    uploadedBy: number;
}

// ============================================
// R2 Bindings Type (for Cloudflare)
// ============================================

export interface R2Bucket {
    put(key: string, value: ArrayBuffer | ReadableStream, options?: R2PutOptions): Promise<R2Object>;
    get(key: string): Promise<R2ObjectBody | null>;
    delete(key: string): Promise<void>;
    list(options?: R2ListOptions): Promise<R2Objects>;
    head(key: string): Promise<R2Object | null>;
}

interface R2PutOptions {
    httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
        contentDisposition?: string;
    };
    customMetadata?: Record<string, string>;
}

interface R2Object {
    key: string;
    size: number;
    etag: string;
    httpEtag: string;
    uploaded: Date;
    httpMetadata?: Record<string, string>;
    customMetadata?: Record<string, string>;
}

interface R2ObjectBody extends R2Object {
    body: ReadableStream;
    bodyUsed: boolean;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T>(): Promise<T>;
    blob(): Promise<Blob>;
}

interface R2ListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
    delimiter?: string;
}

interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a unique file key for storage
 */
export function generateFileKey(userId: number, filename: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = getFileExtension(filename);
    const sanitizedName = sanitizeFilename(filename);

    return `uploads/${userId}/${timestamp}_${random}_${sanitizedName}${extension}`;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
    // Remove extension
    const name = filename.replace(/\.[^/.]+$/, '');

    // Replace unsafe characters
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const match = filename.match(/\.[^/.]+$/);
    return match ? match[0].toLowerCase() : '';
}

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(mimeType: string, extension: string): boolean {
    return ALL_ALLOWED_MIME_TYPES.includes(mimeType) ||
        ALL_ALLOWED_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Get file category based on MIME type
 */
export function getFileCategory(mimeType: string): 'document' | 'image' | 'archive' | 'other' {
    if (UPLOAD_CONFIG.allowedMimeTypes.document.includes(mimeType)) return 'document';
    if (UPLOAD_CONFIG.allowedMimeTypes.image.includes(mimeType)) return 'image';
    if (UPLOAD_CONFIG.allowedMimeTypes.archive.includes(mimeType)) return 'archive';
    return 'other';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ============================================
// Upload Handler (R2)
// ============================================

/**
 * Upload file to R2 bucket
 */
export async function uploadToR2(
    bucket: R2Bucket,
    file: ArrayBuffer | ReadableStream,
    metadata: {
        filename: string;
        contentType: string;
        size: number;
        userId: number;
    }
): Promise<UploadResult> {
    try {
        const key = generateFileKey(metadata.userId, metadata.filename);

        await bucket.put(key, file, {
            httpMetadata: {
                contentType: metadata.contentType,
                cacheControl: 'public, max-age=31536000',
                contentDisposition: `inline; filename="${encodeURIComponent(metadata.filename)}"`,
            },
            customMetadata: {
                originalFilename: metadata.filename,
                uploadedBy: String(metadata.userId),
                uploadedAt: new Date().toISOString(),
            },
        });

        return {
            success: true,
            key,
            filename: metadata.filename,
            size: metadata.size,
            contentType: metadata.contentType,
            url: `/api/files/${key}`, // Public URL will be served through API
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Gagal mengupload file',
        };
    }
}

/**
 * Get file from R2 bucket
 */
export async function getFromR2(
    bucket: R2Bucket,
    key: string
): Promise<{ body: ReadableStream; metadata: R2Object } | null> {
    try {
        const object = await bucket.get(key);
        if (!object) return null;

        return {
            body: object.body,
            metadata: {
                key: object.key,
                size: object.size,
                etag: object.etag,
                httpEtag: object.httpEtag,
                uploaded: object.uploaded,
                httpMetadata: object.httpMetadata,
                customMetadata: object.customMetadata,
            },
        };
    } catch (error) {
        return null;
    }
}

/**
 * Delete file from R2 bucket
 */
export async function deleteFromR2(bucket: R2Bucket, key: string): Promise<boolean> {
    try {
        await bucket.delete(key);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * List files in R2 bucket
 */
export async function listFromR2(
    bucket: R2Bucket,
    prefix?: string,
    limit: number = 100
): Promise<FileMetadata[]> {
    try {
        const result = await bucket.list({ prefix, limit });

        return result.objects.map(obj => ({
            key: obj.key,
            filename: obj.customMetadata?.originalFilename || obj.key,
            contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
            size: obj.size,
            uploadedAt: obj.uploaded.toISOString(),
            uploadedBy: Number(obj.customMetadata?.uploadedBy) || 0,
        }));
    } catch (error) {
        return [];
    }
}

// ============================================
// File Routes Helper
// ============================================

/**
 * Parse multipart form data (for file uploads)
 */
export async function parseMultipartFormData(request: Request): Promise<{
    fields: Record<string, string>;
    files: Array<{
        name: string;
        filename: string;
        contentType: string;
        data: ArrayBuffer;
    }>;
}> {
    const formData = await request.formData();
    const fields: Record<string, string> = {};
    const files: Array<{
        name: string;
        filename: string;
        contentType: string;
        data: ArrayBuffer;
    }> = [];

    for (const [name, value] of formData.entries()) {
        if (value instanceof File) {
            files.push({
                name,
                filename: value.name,
                contentType: value.type,
                data: await value.arrayBuffer(),
            });
        } else {
            fields[name] = value;
        }
    }

    return { fields, files };
}
