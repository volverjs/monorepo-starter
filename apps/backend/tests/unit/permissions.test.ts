import type { FastifyInstance, FastifyRequest } from 'fastify'
import Fastify from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Subject, createAbility } from 'ability'
import { type RouteConfigWithPermissions, withPermissions } from '~/controllers'
import {
    ForbiddenError,
    fastifyProblemJson,
} from '~/plugins/fastifyProblemJson'

// The permission check of the route decorators on a bare Fastify instance: the
// role comes from a header instead of a session, everything else is the real
// code. The hook cases hung or skipped the route's own hooks until 2026-09-29.
describe('withPermissions', () => {
    let server: FastifyInstance
    let handled: number

    beforeEach(async () => {
        handled = 0
        server = Fastify({ logger: false })
        await server.register(fastifyProblemJson)
        server.addHook('onRequest', async (request) => {
            const role = request.headers['x-role'] as string | undefined
            request.user = role
                ? ({ role } as FastifyRequest['user'])
                : undefined
            request.ability = createAbility(
                role ? { id: 'someone', role } : null,
            )
        })
    })

    afterEach(async () => {
        await server.close()
    })

    const route = (config: Omit<RouteConfigWithPermissions, 'url'>) => {
        const { url, options } = withPermissions({ url: '/todos', ...config })
        server.post(url, options ?? {}, async () => {
            handled++
            return { ok: true }
        })
    }

    const post = (role?: string) =>
        server.inject({
            method: 'POST',
            url: '/todos',
            payload: { title: 'A todo' },
            headers: role ? { 'x-role': role } : {},
        })

    const createTodo = { create: Subject.Todo }
    const createUser = { create: Subject.User }

    it('refuses an anonymous request with a 401', async () => {
        route({ permissions: createTodo })
        const response = await post()
        expect(response.statusCode).toBe(401)
        expect(handled).toBe(0)
    })

    it('refuses a signed-in role without the capability with a 403', async () => {
        route({ permissions: createUser })
        const response = await post('user')
        expect(response.statusCode).toBe(403)
        expect(response.headers['content-type']).toContain(
            'application/problem+json',
        )
        expect(handled).toBe(0)
    })

    it('lets a role with the capability through', async () => {
        route({ permissions: createTodo })
        const response = await post('admin')
        expect(response.statusCode).toBe(200)
        expect(handled).toBe(1)
    })

    it("runs the route's own async preHandler after the check", async () => {
        route({
            permissions: createTodo,
            options: {
                preHandler: async (_request, reply) => {
                    reply.header('x-own', 'async')
                },
            },
        })
        const response = await post('admin')
        expect(response.statusCode).toBe(200)
        expect(response.headers['x-own']).toBe('async')
    })

    it('keeps every hook of a preHandler array', async () => {
        route({
            permissions: createTodo,
            options: {
                preHandler: [
                    (_request, reply, done) => {
                        reply.header('x-first', '1')
                        done()
                    },
                    async (_request, reply) => {
                        reply.header('x-second', '2')
                    },
                ],
            },
        })
        const response = await post('admin')
        expect(response.headers['x-first']).toBe('1')
        expect(response.headers['x-second']).toBe('2')
    })

    it('awaits a permissions function before the handler', async () => {
        route({
            permissions: async () => {
                await Promise.resolve()
                throw new ForbiddenError('Not this one')
            },
        })
        const response = await post('admin')
        expect(response.statusCode).toBe(403)
        expect(response.json()).toMatchObject({ title: 'Not this one' })
        expect(handled).toBe(0)
    })
})
