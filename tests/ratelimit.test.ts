/**
 * Rate Limiter Tests
 * Tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    checkRateLimit,
    resetRateLimits,
    RATE_LIMITS,
    type RateLimitConfig,
} from '../src/lib/ratelimit';

describe('Rate Limit Configuration', () => {
    it('should have auth rate limits', () => {
        expect(RATE_LIMITS.auth).toBeDefined();
        expect(RATE_LIMITS.auth.maxRequests).toBe(5);
        expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it('should have AI rate limits', () => {
        expect(RATE_LIMITS.ai).toBeDefined();
        expect(RATE_LIMITS.ai.maxRequests).toBe(10);
        expect(RATE_LIMITS.ai.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it('should have API rate limits', () => {
        expect(RATE_LIMITS.api).toBeDefined();
        expect(RATE_LIMITS.api.maxRequests).toBe(60);
        expect(RATE_LIMITS.api.windowMs).toBe(60 * 1000); // 1 minute
    });

    it('should have read rate limits', () => {
        expect(RATE_LIMITS.read).toBeDefined();
        expect(RATE_LIMITS.read.maxRequests).toBe(200);
    });
});

describe('checkRateLimit', () => {
    const testConfig: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 60000, // 1 minute
    };

    beforeEach(() => {
        // Reset all rate limits before each test
        resetRateLimits();
    });

    it('should allow requests under limit', () => {
        const result1 = checkRateLimit('192.168.1.1', testConfig);
        expect(result1.allowed).toBe(true);
        expect(result1.remaining).toBe(2);

        const result2 = checkRateLimit('192.168.1.1', testConfig);
        expect(result2.allowed).toBe(true);
        expect(result2.remaining).toBe(1);
    });

    it('should block requests over limit', () => {
        // Use up all allowed requests
        checkRateLimit('192.168.1.2', testConfig);
        checkRateLimit('192.168.1.2', testConfig);
        checkRateLimit('192.168.1.2', testConfig);

        // This should be blocked
        const result = checkRateLimit('192.168.1.2', testConfig);
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('should track different IPs separately', () => {
        // Use up IP1 limit
        checkRateLimit('192.168.1.3', testConfig);
        checkRateLimit('192.168.1.3', testConfig);
        checkRateLimit('192.168.1.3', testConfig);

        // IP2 should still have full limit
        const result = checkRateLimit('192.168.1.4', testConfig);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2);
    });

    it('should provide retry after time when blocked', () => {
        // Use up all requests
        checkRateLimit('192.168.1.5', testConfig);
        checkRateLimit('192.168.1.5', testConfig);
        checkRateLimit('192.168.1.5', testConfig);

        const result = checkRateLimit('192.168.1.5', testConfig);
        expect(result.allowed).toBe(false);
        expect(result.retryAfter).toBeDefined();
        expect(result.retryAfter).toBeGreaterThan(0);
        expect(result.retryAfter).toBeLessThanOrEqual(60); // Max 60 seconds
    });

    it('should reset after window expires', () => {
        // Mock Date.now
        const originalNow = Date.now;
        let currentTime = 1000000;
        vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

        // Use up all requests
        checkRateLimit('192.168.1.6', testConfig);
        checkRateLimit('192.168.1.6', testConfig);
        checkRateLimit('192.168.1.6', testConfig);

        // Should be blocked
        const blockedResult = checkRateLimit('192.168.1.6', testConfig);
        expect(blockedResult.allowed).toBe(false);

        // Advance time past the window
        currentTime += testConfig.windowMs + 1;

        // Should be allowed again
        const allowedResult = checkRateLimit('192.168.1.6', testConfig);
        expect(allowedResult.allowed).toBe(true);
        expect(allowedResult.remaining).toBe(2);

        // Restore Date.now
        vi.restoreAllMocks();
    });
});

describe('resetRateLimits', () => {
    it('should clear all rate limit data', () => {
        const config: RateLimitConfig = { maxRequests: 2, windowMs: 60000 };

        // Use up the limit
        checkRateLimit('192.168.1.10', config);
        checkRateLimit('192.168.1.10', config);

        const beforeReset = checkRateLimit('192.168.1.10', config);
        expect(beforeReset.allowed).toBe(false);

        // Reset
        resetRateLimits();

        // Should be allowed again
        const afterReset = checkRateLimit('192.168.1.10', config);
        expect(afterReset.allowed).toBe(true);
        expect(afterReset.remaining).toBe(1);
    });
});
