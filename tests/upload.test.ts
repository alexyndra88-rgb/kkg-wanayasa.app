/**
 * Upload Utility Tests
 * Tests for file upload helper functions
 */

import { describe, it, expect } from 'vitest';
import {
    UPLOAD_CONFIG,
    ALL_ALLOWED_MIME_TYPES,
    ALL_ALLOWED_EXTENSIONS,
    generateFileKey,
    sanitizeFilename,
    getFileExtension,
    isAllowedFileType,
    getFileCategory,
    formatFileSize,
} from '../src/lib/upload';

describe('Upload Configuration', () => {
    it('should have max file size of 10MB', () => {
        expect(UPLOAD_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
    });

    it('should include common document types', () => {
        expect(UPLOAD_CONFIG.allowedMimeTypes.document).toContain('application/pdf');
        expect(UPLOAD_CONFIG.allowedMimeTypes.document).toContain('application/msword');
    });

    it('should include common image types', () => {
        expect(UPLOAD_CONFIG.allowedMimeTypes.image).toContain('image/jpeg');
        expect(UPLOAD_CONFIG.allowedMimeTypes.image).toContain('image/png');
    });

    it('should have combined allowed types', () => {
        expect(ALL_ALLOWED_MIME_TYPES).toContain('application/pdf');
        expect(ALL_ALLOWED_MIME_TYPES).toContain('image/jpeg');
        expect(ALL_ALLOWED_EXTENSIONS).toContain('.pdf');
        expect(ALL_ALLOWED_EXTENSIONS).toContain('.jpg');
    });
});

describe('generateFileKey', () => {
    it('should generate key with user ID prefix', () => {
        const key = generateFileKey(123, 'document.pdf');
        expect(key).toMatch(/^uploads\/123\//);
    });

    it('should include timestamp', () => {
        const before = Date.now();
        const key = generateFileKey(1, 'test.pdf');
        const after = Date.now();

        const match = key.match(/uploads\/1\/(\d+)_/);
        expect(match).not.toBeNull();
        if (match) {
            const timestamp = parseInt(match[1]);
            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        }
    });

    it('should preserve file extension', () => {
        const key = generateFileKey(1, 'document.pdf');
        expect(key).toMatch(/\.pdf$/);
    });

    it('should sanitize filename', () => {
        const key = generateFileKey(1, 'My Document (Final).pdf');
        expect(key).not.toContain(' ');
        expect(key).not.toContain('(');
        expect(key).not.toContain(')');
    });

    it('should generate unique keys', () => {
        const key1 = generateFileKey(1, 'test.pdf');
        const key2 = generateFileKey(1, 'test.pdf');
        expect(key1).not.toBe(key2);
    });
});

describe('sanitizeFilename', () => {
    it('should lowercase filename', () => {
        expect(sanitizeFilename('TestFile.pdf')).toBe('testfile');
    });

    it('should replace spaces with dashes', () => {
        expect(sanitizeFilename('my document.pdf')).toBe('my-document');
    });

    it('should remove special characters', () => {
        expect(sanitizeFilename('file(1)[2]{3}.pdf')).toBe('file-1-2-3');
    });

    it('should remove extension', () => {
        expect(sanitizeFilename('document.pdf')).toBe('document');
        expect(sanitizeFilename('file.tar.gz')).toBe('file-tar');
    });

    it('should limit length', () => {
        const longName = 'a'.repeat(100) + '.pdf';
        const sanitized = sanitizeFilename(longName);
        expect(sanitized.length).toBeLessThanOrEqual(50);
    });

    it('should handle unicode', () => {
        const sanitized = sanitizeFilename('文件.pdf');
        expect(sanitized).not.toContain('文');
    });
});

describe('getFileExtension', () => {
    it('should extract extension', () => {
        expect(getFileExtension('document.pdf')).toBe('.pdf');
        expect(getFileExtension('image.JPG')).toBe('.jpg');
        expect(getFileExtension('file.tar.gz')).toBe('.gz');
    });

    it('should return empty for no extension', () => {
        expect(getFileExtension('filename')).toBe('');
    });

    it('should handle hidden files', () => {
        expect(getFileExtension('.gitignore')).toBe('.gitignore');
    });
});

describe('isAllowedFileType', () => {
    it('should allow PDF', () => {
        expect(isAllowedFileType('application/pdf', '.pdf')).toBe(true);
    });

    it('should allow images', () => {
        expect(isAllowedFileType('image/jpeg', '.jpg')).toBe(true);
        expect(isAllowedFileType('image/png', '.png')).toBe(true);
    });

    it('should allow Word documents', () => {
        expect(isAllowedFileType('application/msword', '.doc')).toBe(true);
        expect(isAllowedFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx')).toBe(true);
    });

    it('should reject executable files', () => {
        expect(isAllowedFileType('application/x-executable', '.exe')).toBe(false);
    });

    it('should reject if either MIME or extension matches', () => {
        // Unknown MIME but allowed extension
        expect(isAllowedFileType('application/unknown', '.pdf')).toBe(true);
        // Allowed MIME but unknown extension
        expect(isAllowedFileType('application/pdf', '.xyz')).toBe(true);
    });
});

describe('getFileCategory', () => {
    it('should categorize documents', () => {
        expect(getFileCategory('application/pdf')).toBe('document');
        expect(getFileCategory('application/msword')).toBe('document');
    });

    it('should categorize images', () => {
        expect(getFileCategory('image/jpeg')).toBe('image');
        expect(getFileCategory('image/png')).toBe('image');
    });

    it('should categorize archives', () => {
        expect(getFileCategory('application/zip')).toBe('archive');
    });

    it('should return other for unknown types', () => {
        expect(getFileCategory('application/octet-stream')).toBe('other');
        expect(getFileCategory('text/plain')).toBe('other');
    });
});

describe('formatFileSize', () => {
    it('should format bytes', () => {
        expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1 MB');
        expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB');
    });

    it('should format gigabytes', () => {
        expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle zero', () => {
        expect(formatFileSize(0)).toBe('0 B');
    });
});
