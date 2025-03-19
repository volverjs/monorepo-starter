import { timestamp, uuid, boolean } from 'drizzle-orm/pg-core'
import { user } from './schema/Auth'

export const entityDefaultColumns = {
    id: uuid('id').defaultRandom().primaryKey(),
    // metadata
    createdAt: timestamp('created_at', {
        withTimezone: true,
        mode: 'date',
    })
        .notNull()
        .defaultNow(),
    createdBy: uuid('created_by')
        .notNull()
        .references(() => user.id),
    updatedAt: timestamp('updated_at', {
        withTimezone: true,
        mode: 'date',
    })
        .notNull()
        .defaultNow(),
    updatedBy: uuid('updated_by')
        .notNull()
        .references(() => user.id),
    deleted: boolean('deleted').notNull().default(false),
    deletedAt: timestamp('deleted_at', {
        withTimezone: true,
        mode: 'date',
    }),
    deletedBy: uuid('deleted_by').references(() => user.id),
}
