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
        projects: [
            {
                extends: true,
                test: {
                    // No database: `--project unit` runs without Docker.
                    name: 'unit',
                    include: ['tests/unit/**/*.test.ts'],
                    // Before any test file is imported: the auth and database
                    // packages read process.env when their module is evaluated.
                    setupFiles: ['./tests/setup/env.ts'],
                },
            },
            {
                extends: true,
                test: {
                    // The real Postgres of docker-compose.yml, on a database
                    // recreated and migrated once per run (TEST_DATABASE_URL).
                    name: 'integration',
                    include: ['tests/integration/**/*.test.ts'],
                    globalSetup: ['./tests/setup/database.ts'],
                    setupFiles: [
                        './tests/setup/env.ts',
                        './tests/setup/integration.ts',
                    ],
                },
            },
        ],
    },
})
