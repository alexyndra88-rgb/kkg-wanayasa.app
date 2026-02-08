/**
 * QR Code Generator for Absensi
 * Generates and validates QR codes for attendance check-in
 */

import QRCode from 'qrcode';

// Token secret - in production, use a proper secret from env
const TOKEN_SECRET = 'kkg-wanayasa-qr-secret-2026';

/**
 * Generate QR code data for a kegiatan
 * Format: kkg-absensi:kegiatan_id:timestamp:signature
 */
export function generateQRData(kegiatanId: number, expiresInMinutes: number = 60): string {
    const timestamp = Date.now();
    const expiry = timestamp + (expiresInMinutes * 60 * 1000);
    const dataToSign = `${kegiatanId}:${expiry}:${TOKEN_SECRET}`;

    // Simple hash for signature (in production, use proper HMAC)
    const signature = simpleHash(dataToSign);

    return `kkg-absensi:${kegiatanId}:${expiry}:${signature}`;
}

/**
 * Parse and validate QR data
 */
export function parseQRData(qrData: string): {
    valid: boolean;
    kegiatanId?: number;
    expired?: boolean;
    error?: string;
} {
    try {
        if (!qrData.startsWith('kkg-absensi:')) {
            return { valid: false, error: 'Format QR code tidak valid' };
        }

        const parts = qrData.split(':');
        if (parts.length !== 4) {
            return { valid: false, error: 'Format QR code tidak valid' };
        }

        const [, kegiatanIdStr, expiryStr, signature] = parts;
        const kegiatanId = parseInt(kegiatanIdStr, 10);
        const expiry = parseInt(expiryStr, 10);

        if (isNaN(kegiatanId) || isNaN(expiry)) {
            return { valid: false, error: 'Data QR code tidak valid' };
        }

        // Check expiry
        if (Date.now() > expiry) {
            return { valid: false, kegiatanId, expired: true, error: 'QR code sudah kadaluarsa' };
        }

        // Verify signature
        const dataToSign = `${kegiatanId}:${expiry}:${TOKEN_SECRET}`;
        const expectedSignature = simpleHash(dataToSign);

        if (signature !== expectedSignature) {
            return { valid: false, error: 'QR code tidak valid (signature mismatch)' };
        }

        return { valid: true, kegiatanId };
    } catch (e) {
        return { valid: false, error: 'Gagal memproses QR code' };
    }
}

/**
 * Generate QR code as base64 PNG
 */
export async function generateQRCodePNG(data: string, size: number = 256): Promise<string> {
    try {
        const url = await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: size,
            margin: 2,
            color: {
                dark: '#1e40af',
                light: '#ffffff'
            }
        });
        return url;
    } catch (e) {
        console.error('QR generation error:', e);
        throw new Error('Gagal generate QR code');
    }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(data: string): Promise<string> {
    try {
        const svg = await QRCode.toString(data, {
            type: 'svg',
            errorCorrectionLevel: 'M',
            margin: 2,
            color: {
                dark: '#1e40af',
                light: '#ffffff'
            }
        });
        return svg;
    } catch (e) {
        console.error('QR generation error:', e);
        throw new Error('Gagal generate QR code');
    }
}

/**
 * Simple hash function (for demo purposes)
 * In production, use Web Crypto API for HMAC
 */
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Generate a more secure token using Web Crypto
 */
export async function generateSecureToken(kegiatanId: number, expiresInMinutes: number = 60): Promise<string> {
    const timestamp = Date.now();
    const expiry = timestamp + (expiresInMinutes * 60 * 1000);

    // Create signature using Web Crypto API
    const data = `${kegiatanId}:${expiry}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(TOKEN_SECRET);
    const messageData = encoder.encode(data);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray = new Uint8Array(signatureBuffer);
    const signature = Array.from(signatureArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .substring(0, 16); // Take first 16 chars for shorter QR

    return `kkg-absensi:${kegiatanId}:${expiry}:${signature}`;
}

/**
 * Verify secure token
 */
export async function verifySecureToken(qrData: string): Promise<{
    valid: boolean;
    kegiatanId?: number;
    expired?: boolean;
    error?: string;
}> {
    try {
        if (!qrData.startsWith('kkg-absensi:')) {
            return { valid: false, error: 'Format QR code tidak valid' };
        }

        const parts = qrData.split(':');
        if (parts.length !== 4) {
            return { valid: false, error: 'Format QR code tidak valid' };
        }

        const [, kegiatanIdStr, expiryStr, signature] = parts;
        const kegiatanId = parseInt(kegiatanIdStr, 10);
        const expiry = parseInt(expiryStr, 10);

        if (isNaN(kegiatanId) || isNaN(expiry)) {
            return { valid: false, error: 'Data QR code tidak valid' };
        }

        // Check expiry
        if (Date.now() > expiry) {
            return { valid: false, kegiatanId, expired: true, error: 'QR code sudah kadaluarsa' };
        }

        // Verify signature
        const data = `${kegiatanId}:${expiry}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(TOKEN_SECRET);
        const messageData = encoder.encode(data);

        const key = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
        const signatureArray = new Uint8Array(signatureBuffer);
        const expectedSignature = Array.from(signatureArray)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .substring(0, 16);

        if (signature !== expectedSignature) {
            return { valid: false, error: 'QR code tidak valid' };
        }

        return { valid: true, kegiatanId };
    } catch (e) {
        return { valid: false, error: 'Gagal memproses QR code' };
    }
}
