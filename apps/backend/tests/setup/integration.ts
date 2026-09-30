import { afterAll, inject } from 'vitest'

// Runs in each worker before the test file is imported, so the database
// package, evaluated by that import, connects to the test database.
process.env.DATABASE_URL = inject('databaseUrl')

afterAll(async () => {
    const { database } = await import('database')
    await database.$client.end()
})
