import type { TestProject } from 'vitest/node'
import fs from 'node:fs'
import path from 'node:path'
import { parseEnv } from 'node:util'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

declare module 'vitest' {
    export interface ProvidedContext {
        databaseUrl: string
    }
}

const backendDir = path.resolve(import.meta.dirname, '../..')
const migrationsFolder = path.resolve(
    backendDir,
    '../../packages/database/drizzle',
)

// The shell wins, then .env.local, then .env: the order the backend reads its
// environment in. Only the variable asked for is read, the rest of the files
// is left alone.
const readEnv = (key: string) => {
    if (process.env[key]) {
        return process.env[key]
    }
    for (const file of ['.env.local', '.env']) {
        const envFile = path.join(backendDir, file)
        if (fs.existsSync(envFile)) {
            const value = parseEnv(fs.readFileSync(envFile, 'utf8'))[key]
            if (value) {
                return value
            }
        }
    }
    return undefined
}

// TEST_DATABASE_URL when set, otherwise the server of DATABASE_URL with
// `_test` after the database name: whoever moves the local Postgres to
// another port moves the tests with it.
const testDatabaseUrl = () => {
    const explicit = readEnv('TEST_DATABASE_URL')
    if (explicit) {
        return new URL(explicit)
    }
    const base = readEnv('DATABASE_URL')
    if (!base) {
        throw new Error('DATABASE_URL is not set, see apps/backend/.env')
    }
    const url = new URL(base)
    url.pathname = `/${decodeURIComponent(url.pathname.slice(1))}_test`
    return url
}

/**
 * Once per run: drop and recreate the test database, then apply every
 * migration, so the suite also proves the migration history on a real
 * Postgres. Test files share it and run in parallel: each one signs up its own
 * users and asserts on their rows only.
 */
export default async function setup(project: TestProject) {
    const url = testDatabaseUrl()
    const name = decodeURIComponent(url.pathname.slice(1))
    // Dropped at every run: refuse a name that could hold real data. Postgres
    // cuts identifiers at 63 bytes, so a longer `<name>_test` would lose its
    // suffix and name the application database.
    if (!name.endsWith('_test') || Buffer.byteLength(name) > 63) {
        throw new Error(
            `The test database "${name}" is dropped at every run: its name must end in _test and fit in 63 bytes`,
        )
    }

    const maintenanceUrl = new URL(url)
    maintenanceUrl.pathname = '/postgres'
    const server = postgres(maintenanceUrl.href, {
        max: 1,
        onnotice: () => {},
    })
    try {
        await server`DROP DATABASE IF EXISTS ${server(name)} WITH (FORCE)`
        await server`CREATE DATABASE ${server(name)}`
    } catch (error) {
        throw new Error(
            `Cannot prepare the test database on ${url.host}. Is Postgres running (docker compose up -d postgres)?`,
            { cause: error },
        )
    } finally {
        await server.end()
    }

    const client = postgres(url.href, { max: 1, onnotice: () => {} })
    try {
        await migrate(drizzle(client), { migrationsFolder })
    } finally {
        await client.end()
    }

    project.provide('databaseUrl', url.href)
}
