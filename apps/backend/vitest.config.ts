import { defineConfig } from 'vitest/config'
import path from 'path'

// Separate from vite.config.ts on purpose: that one carries vite-plugin-node,
// which would start the dev server inside the test run.
export default defineConfig({
    resolve: {
        alias: {
            '~/': `${path.resolve(import.meta.dirname, 'src')}/`,
        },
    },
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        // Before any test file is imported: the auth and database packages
        // read process.env when their module is evaluated.
        setupFiles: ['./tests/setup/env.ts'],
    },
})
