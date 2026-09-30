import type { FastifyRequest } from 'fastify'
import type { TodoQuerystring, TodoDto } from 'models'
import type { TodoService } from '~/services/todo.service'
import * as z from 'zod'
import { TodoDtoSchema, TodoSchema, TodoQuerystringSchema } from 'models'
import { Subject } from 'ability'
import { Controller, DELETE, GET, POST, PUT, getActor } from './index'
import { container } from '~/container'
import { TOKENS } from '~/container/tokens'

/**
 * The reference controller: routes, schemas and permissions only, every rule
 * about rows lives in the service. `permissions` refuses an anonymous request
 * (401) and a role with no rule on todos (403); which todos a role may touch
 * is the service's call.
 */
@Controller({
    route: '/v1/todos',
    tags: [
        {
            name: Subject.Todo,
        },
    ],
})
export default class TodosController {
    private _service: TodoService

    constructor() {
        this._service = container.get(TOKENS.todoService)
    }

    @GET({
        url: '/',
        permissions: {
            read: Subject.Todo,
        },
        options: {
            schema: {
                querystring: TodoQuerystringSchema,
                response: {
                    200: z.array(TodoSchema),
                },
            },
        },
    })
    async list(request: FastifyRequest<{ Querystring: TodoQuerystring }>) {
        return await this._service.list(request.query, getActor(request))
    }

    @GET({
        url: '/:id',
        permissions: {
            read: Subject.Todo,
        },
        options: {
            schema: {
                params: z.object({ id: z.uuid() }),
                response: {
                    200: TodoSchema,
                },
            },
        },
    })
    async get(request: FastifyRequest<{ Params: { id: string } }>) {
        return await this._service.get(request.params.id, getActor(request))
    }

    @POST({
        url: '/',
        permissions: {
            create: Subject.Todo,
        },
        options: {
            schema: {
                body: TodoDtoSchema,
                response: {
                    200: TodoSchema,
                },
            },
        },
    })
    async create(request: FastifyRequest<{ Body: TodoDto }>) {
        return await this._service.create(request.body, getActor(request))
    }

    @PUT({
        url: '/:id',
        permissions: {
            update: Subject.Todo,
        },
        options: {
            schema: {
                params: z.object({ id: z.uuid() }),
                body: TodoDtoSchema,
                response: {
                    200: TodoSchema,
                },
            },
        },
    })
    async update(
        request: FastifyRequest<{ Body: TodoDto; Params: { id: string } }>,
    ) {
        return await this._service.update(
            request.params.id,
            request.body,
            getActor(request),
        )
    }

    @DELETE({
        url: '/:id',
        permissions: {
            delete: Subject.Todo,
        },
        options: {
            schema: {
                params: z.object({ id: z.uuid() }),
                response: {
                    200: z.boolean(),
                },
            },
        },
    })
    async delete(request: FastifyRequest<{ Params: { id: string } }>) {
        return await this._service.delete(request.params.id, getActor(request))
    }
}
