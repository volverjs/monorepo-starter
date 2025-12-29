import z from 'zod/v4'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { todo } from 'database/schema'
import { zodQs } from '../utils'

export const TodoDtoSchema = createInsertSchema(todo, {
    createdBy: (schema) => schema.optional().readonly(),
    updatedBy: (schema) => schema.optional().readonly(),
    createdAt: (schema) => schema.or(z.string()).optional().readonly(),
    updatedAt: (schema) => schema.or(z.string()).optional().readonly(),
    deleted: (schema) => schema.optional().readonly(),
    deletedAt: (schema) => schema.or(z.string()).optional().readonly(),
    deletedBy: (schema) => schema.optional().readonly(),
})

export const TodoSchema = createSelectSchema(todo)

export const TodoQuerystringSchema = z.object({
    ...zodQs.pagination(),
    ...zodQs.sort(['title', 'done', 'updatedAt', 'createdAt']),
    ...zodQs.filters(['done']),
    ...zodQs.fullText(),
    ...zodQs.ids(),
})

export type TodoDto = z.infer<typeof TodoDtoSchema>
export type Todo = z.infer<typeof TodoSchema>
export type TodoQuerystring = z.infer<typeof TodoQuerystringSchema>
