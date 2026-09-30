import * as z from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { todo } from 'database/schema'
import { serverManagedColumns, softDeleteColumns, zodQs } from '../utils'

/**
 * What a client sends to create or update a todo. The columns the server
 * writes are omitted, and the route validation strips unknown keys, so a body
 * cannot set `createdBy` or `deleted`. The frontend form validates with this
 * same schema.
 */
export const TodoDtoSchema = createInsertSchema(todo, {
    title: (schema) => schema.trim().min(1).max(200),
}).omit(serverManagedColumns)

/**
 * What the API returns. The dates are coerced: the same schema shapes the row
 * on the server and turns the JSON strings back into dates in the browser
 * (apps/frontend/src/stores/useTodoStore.ts).
 */
export const TodoSchema = createSelectSchema(todo, {
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
}).omit(softDeleteColumns)

export const TodoQuerystringSchema = z.object({
    ...zodQs.pagination(),
    ...zodQs.sort(['title', 'done', 'updatedAt', 'createdAt'], '-updatedAt'),
    ...zodQs.filter('done', z.stringbool()),
    ...zodQs.fullText(),
    ...zodQs.ids(),
})

export type TodoDto = z.infer<typeof TodoDtoSchema>
export type Todo = z.infer<typeof TodoSchema>
export type TodoQuerystring = z.infer<typeof TodoQuerystringSchema>
