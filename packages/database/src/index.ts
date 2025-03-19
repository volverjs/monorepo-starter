import type { Logger } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

class QueryLogger implements Logger {
    logQuery(query: string, params: unknown[]): void {
        // eslint-disable-next-line no-console
        console.debug('___QUERY___')
        // eslint-disable-next-line no-console
        console.debug(query)
        // eslint-disable-next-line no-console
        console.debug(params)
        // eslint-disable-next-line no-console
        console.debug('___END_QUERY___')
    }
}

// create a new query logger if we are not in production
const logger = process.env.VITE_PROD ? undefined : new QueryLogger()

// create a new postgres client
const queryClient = postgres(process.env.VITE_DATABASE_URL)

// create a new drizzle instance
const database = drizzle(queryClient, {
    schema,
    logger,
})

export type Database = typeof database
export { database, schema }
