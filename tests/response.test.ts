/**
 * Response Utility Tests
 * Tests for API response helpers
 */

import { describe, it, expect, vi } from 'vitest';
import {
    ErrorCodes,
    validateRequired
} from '../src/lib/response';

describe('ErrorCodes', () => {
    it('should have all required error codes', () => {
        expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
        expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
        expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
        expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
        expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
        expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
        expect(ErrorCodes.AI_ERROR).toBe('AI_ERROR');
        expect(ErrorCodes.DUPLICATE).toBe('DUPLICATE');
        expect(ErrorCodes.CONFIG_ERROR).toBe('CONFIG_ERROR');
    });

    it('should have unique error codes', () => {
        // All error codes should be unique strings
        const values = Object.values(ErrorCodes);
        const uniqueValues = new Set(values);
        expect(values.length).toBe(uniqueValues.size);
    });
});

describe('validateRequired', () => {
    it('should return valid when all fields present', () => {
        const data = {
            name: 'John',
            email: 'john@example.com',
            age: 30,
        };
        const result = validateRequired(data, ['name', 'email', 'age']);
        expect(result.valid).toBe(true);
        expect(result.missing).toEqual([]);
    });

    it('should detect missing fields', () => {
        const data = {
            name: 'John',
        };
        const result = validateRequired(data, ['name', 'email', 'age']);
        expect(result.valid).toBe(false);
        expect(result.missing).toContain('email');
        expect(result.missing).toContain('age');
        expect(result.missing).not.toContain('name');
    });

    it('should treat empty string as missing', () => {
        const data = {
            name: '',
            email: 'john@example.com',
        };
        const result = validateRequired(data, ['name', 'email']);
        expect(result.valid).toBe(false);
        expect(result.missing).toContain('name');
    });

    it('should treat null as missing', () => {
        const data = {
            name: null,
            email: 'john@example.com',
        };
        const result = validateRequired(data, ['name', 'email']);
        expect(result.valid).toBe(false);
        expect(result.missing).toContain('name');
    });

    it('should treat undefined as missing', () => {
        const data = {
            email: 'john@example.com',
        };
        const result = validateRequired(data, ['name', 'email']);
        expect(result.valid).toBe(false);
        expect(result.missing).toContain('name');
    });

    it('should accept 0 as valid value', () => {
        const data = {
            count: 0,
            name: 'Test',
        };
        const result = validateRequired(data, ['count', 'name']);
        expect(result.valid).toBe(true);
        expect(result.missing).toEqual([]);
    });

    it('should accept false as valid value', () => {
        const data = {
            active: false,
            name: 'Test',
        };
        const result = validateRequired(data, ['active', 'name']);
        expect(result.valid).toBe(true);
        expect(result.missing).toEqual([]);
    });

    it('should handle empty fields array', () => {
        const data = { anything: 'value' };
        const result = validateRequired(data, []);
        expect(result.valid).toBe(true);
        expect(result.missing).toEqual([]);
    });

    it('should handle empty data object', () => {
        const data = {};
        const result = validateRequired(data, ['name', 'email']);
        expect(result.valid).toBe(false);
        expect(result.missing).toEqual(['name', 'email']);
    });
});
