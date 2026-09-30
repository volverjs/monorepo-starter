import type { Logger } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { debug } from 'logger'

class QueryLogger implements Logger {
    logQuery(query: string, params: unknown[]): void {
        debug('___QUERY___')
        debug(query)
        debug(params)
        debug('___END_QUERY___')
    }
}

// log queries in development only (the shared logger is silent in a production build)
const logger = import.meta.env?.DEV ? new QueryLogger() : undefined

// create a new postgres client: it connects on the first query, and the
// backend checks at boot that DATABASE_URL is set (apps/backend/src/main.ts)
const queryClient = postgres(process.env.DATABASE_URL as string)

// create a new drizzle instance
const database = drizzle(queryClient, {
    schema,
    logger,
})

export type Database = typeof database
/** What `database.transaction()` hands its callback: same query API. */
export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export { database, schema }
