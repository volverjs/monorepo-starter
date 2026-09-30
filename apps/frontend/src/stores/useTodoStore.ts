import type { Todo, TodoDto } from 'models'
import { RepositoryHttp } from '@volverjs/data'
import { defineStoreRepository } from '@volverjs/query-vue'
import { TodoSchema } from 'models'
import { httpClient } from '~/modules/httpClient'

/**
 * The reference store: one per API resource, next to its controller
 * (apps/backend/src/controllers/todos.controller.ts).
 *
 * - The repository takes the client explicitly: `useRepositoryHttp()` would
 *   look it up in a registry that `modules/httpClient.ts` fills when it is
 *   evaluated, so it would depend on import order.
 * - Every response is parsed with the schema the backend serializes with, so
 *   the dates are `Date` objects here too and a contract drift fails loudly.
 * - The list total comes from `X-Total-Count`, in `metadata.total`.
 * - No read is cached (`defaultPersistence: 0`): a cached count or list would
 *   outlive a write made on another page. Concurrent identical reads still
 *   share one request.
 */
export const todoRepository = new RepositoryHttp<
    TodoDto & { id?: string },
    Todo
>(httpClient, 'api/v1/todos/:id?', {
    responseAdapter: (raw) =>
        (Array.isArray(raw) ? raw : [raw]).map((item) =>
            TodoSchema.parse(item),
        ),
})

export const useTodoStore = defineStoreRepository(todoRepository, 'todos', {
    defaultPersistence: 0,
})
