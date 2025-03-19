import { z } from 'zod'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { schema } from 'database'
import { zodQs } from '../utils'

export const TodoDtoSchema = createInsertSchema(schema.todo, {
    createdBy: (schema) => schema.optional().readonly(),
    updatedBy: (schema) => schema.optional().readonly(),
    createdAt: (schema) => schema.or(z.string()).optional().readonly(),
    updatedAt: (schema) => schema.or(z.string()).optional().readonly(),
    deleted: (schema) => schema.optional().readonly(),
    deletedAt: (schema) => schema.or(z.string()).optional().readonly(),
    deletedBy: (schema) => schema.optional().readonly(),
})

export const TodoSchema = createSelectSchema(schema.todo)

export const TodoQuerystringSchema = z.object({
    ...zodQs.pagination(),
    ...zodQs.sort(['title', 'done', 'updatedAt', 'createdAt']),
    ...zodQs.filters(['done']),
    ...zodQs.fullText(),
    ...zodQs.ids(),
})

export type TodoDto = Zod.infer<typeof TodoDtoSchema>
export type Todo = Zod.infer<typeof TodoSchema>
export type TodoQuerystring = Zod.infer<typeof TodoQuerystringSchema>
