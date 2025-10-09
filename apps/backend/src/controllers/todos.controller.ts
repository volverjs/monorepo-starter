import type { FastifyRequest } from 'fastify'
import type { TodoQuerystring, TodoDto } from 'models'
import type { TodoService } from '~/services/todo.service'
import z from 'zod/v4'
import { TodoDtoSchema, TodoSchema, TodoQuerystringSchema } from 'models'
import { Controller, DELETE, GET, POST, PUT } from './index'
import { container } from '~/container'
import { TOKENS } from '~/container/tokens'
import { Subject } from 'ability'
import { UnauthorizedError } from '~/plugins/fastifyProblemJson'

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
    async read(
        request: FastifyRequest<{
            Querystring: TodoQuerystring
        }>,
    ) {
        return await this._service.read(request.query)
    }

    @POST({
        url: '/',
        options: {
            schema: {
                body: TodoDtoSchema,
                response: {
                    200: TodoSchema,
                },
            },
        },
    })
    async create(
        request: FastifyRequest<{
            Body: TodoDto
        }>,
    ) {
        if (!request.user) {
            throw new UnauthorizedError()
        }
        return await this._service.create(request.body, request.user)
    }

    @GET({
        url: '/:id',
        options: {
            schema: {
                response: {
                    200: TodoSchema,
                },
            },
        },
    })
    async readId(request: FastifyRequest<{ Params: { id: string } }>) {
        return await this._service.read(request.params.id)
    }

    @PUT({
        url: '/:id',
        options: {
            schema: {
                body: TodoDtoSchema,
                response: {
                    200: TodoSchema,
                },
            },
        },
    })
    async update(
        request: FastifyRequest<{
            Body: TodoDto
            Params: {
                id: string
            }
        }>,
    ) {
        if (!request.user) {
            throw new UnauthorizedError()
        }
        return await this._service.update(
            request.params.id,
            request.body,
            request.user,
        )
    }

    @DELETE({
        url: '/:id',
        options: {
            schema: {
                response: {
                    200: z.boolean(),
                },
            },
        },
    })
    async delete(request: FastifyRequest<{ Params: { id: string } }>) {
        if (!request.user) {
            throw new UnauthorizedError()
        }
        return await this._service.delete(request.params.id, request.user)
    }
}
