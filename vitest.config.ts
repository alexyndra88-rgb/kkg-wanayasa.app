import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'happy-dom',
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/types/**',
                'src/**/*.d.ts',
            ],
        },
        // Timeout for async tests
        testTimeout: 10000,
        // Run tests in sequence for D1 tests
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
    },
});
