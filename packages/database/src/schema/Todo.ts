import { pgTable, text, boolean } from 'drizzle-orm/pg-core'
import { entityDefaultColumns } from '../defaultColumns'

export const todo = pgTable('todo', {
    ...entityDefaultColumns,
    title: text('title').notNull(),
    done: boolean('done').notNull().default(false),
})
