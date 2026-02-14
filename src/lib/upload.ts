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
// End of file
// ============================================
