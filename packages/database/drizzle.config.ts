import type { Config } from 'drizzle-kit'
import path from 'path'

// Same database as the backend: DATABASE_URL from the shell wins, then
// apps/backend/.env.local, then apps/backend/.env (loadEnvFile never overwrites
// a variable that is already set). To migrate another environment:
//   DATABASE_URL=postgres://user:password@host:5432/db pnpm db:migrate
// Paths are relative to the working directory, packages/database, where Nx runs
// every target: drizzle-kit loads this file as CommonJS, so `import.meta.dirname`
// is undefined here.
for (const file of ['.env.local', '.env']) {
    try {
        process.loadEnvFile(path.resolve('../../apps/backend', file))
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error
        }
    }
}

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set (see apps/backend/.env)')
}

export default {
    schema: './src/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
} satisfies Config
