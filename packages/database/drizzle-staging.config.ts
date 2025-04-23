import type { Config } from 'drizzle-kit'

export default {
    schema: './src/db/tables/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        host: 'TBD',
        user: 'TBD',
        password: 'TBD',
        database: 'TBD',
        port: 5432,
        ssl: true,
    },
} satisfies Config
