/**
 * Auth Utility Tests
 * Tests for password hashing and verification functions
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { hashPassword, verifyPassword, generateSessionId, generateCSRFToken, getSessionExpiry } from '../src/lib/auth';

describe('Password Hashing', () => {
    it('should hash password with salt', async () => {
        const password = 'TestPassword123';
        const hash = await hashPassword(password);

        // Hash should contain salt:hash format
        expect(hash).toContain(':');

        // Both parts should be hex strings (32 chars salt, 64 chars hash)
        const [salt, hashPart] = hash.split(':');
        expect(salt).toMatch(/^[0-9a-f]{32}$/);
        expect(hashPart).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate different hashes for same password', async () => {
        const password = 'TestPassword123';
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        // Hashes should be different due to random salt
        expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
        const password = 'TestPassword123';
        const hash = await hashPassword(password);

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
        const password = 'TestPassword123';
        const wrongPassword = 'WrongPassword456';
        const hash = await hashPassword(password);

        const isValid = await verifyPassword(wrongPassword, hash);
        expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
        const password = '';
        const hash = await hashPassword(password);

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);

        const isInvalid = await verifyPassword('x', hash);
        expect(isInvalid).toBe(false);
    });

    it('should handle unicode characters', async () => {
        const password = 'пароль密码كلمة';
        const hash = await hashPassword(password);

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
    });

    it('should handle long passwords', async () => {
        const password = 'a'.repeat(1000);
        const hash = await hashPassword(password);

        const isValid = await verifyPassword(password, hash);
        expect(isValid).toBe(true);
    });
});

describe('Session Management', () => {
    it('should generate unique session IDs', () => {
        const id1 = generateSessionId();
        const id2 = generateSessionId();

        expect(id1).not.toBe(id2);
        expect(id1).toMatch(/^[0-9a-f]{64}$/);
        expect(id2).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique CSRF tokens', () => {
        const token1 = generateCSRFToken();
        const token2 = generateCSRFToken();

        expect(token1).not.toBe(token2);
        expect(token1).toMatch(/^[0-9a-f]{64}$/);
        expect(token2).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate session expiry 7 days from now', () => {
        const expiry = getSessionExpiry();
        const expiryDate = new Date(expiry);
        const now = new Date();

        // Should be approximately 7 days from now
        const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThan(6.9);
        expect(diffDays).toBeLessThan(7.1);
    });

    it('should return ISO string for expiry', () => {
        const expiry = getSessionExpiry();

        // Should be valid ISO string
        expect(new Date(expiry).toISOString()).toBe(expiry);
    });
});
