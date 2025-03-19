import type { Config } from 'drizzle-kit'

export default {
    schema: './src/schema/index.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        host: 'localhost',
        user: 'postgres',
        password: 'Volverjs!',
        database: 'postgres',
        port: 5432,
        ssl: false,
    },
} satisfies Config
