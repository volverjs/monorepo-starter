import { pgTable, text, uuid, varchar, index } from 'drizzle-orm/pg-core'
import { entityDefaultColumns } from '../defaultColumns'

export const snapshot = pgTable(
    'snapshot',
    {
        ...entityDefaultColumns,
        // attributes
        entityName: varchar('entity_name', { length: 32 }).notNull(),
        entityId: uuid('entity_id').notNull(),
        scope: varchar('scope', { length: 512 }).notNull(),
        content: text('content').notNull(),
    },
    (table) => [
        index('EntityName').on(table.entityName),
        index('EntityId').on(table.entityId),
        index('EntityIdName').on(table.entityId, table.entityName),
    ],
)
