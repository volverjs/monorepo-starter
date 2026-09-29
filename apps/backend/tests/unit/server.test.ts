import type { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildServer } from '~/app'

// The real application, every plugin and controller, without a database:
// none of these requests carries a session, so none reaches a query.
describe('server', () => {
    let server: FastifyInstance

    beforeAll(async () => {
        server = await buildServer({ logger: false })
    })

    afterAll(async () => {
        await server.close()
    })

    it('answers the health check', async () => {
        const response = await server.inject('/api/health/ping')
        expect(response.statusCode).toBe(200)
        expect(response.body).toBe('pong')
    })

    it('refuses an anonymous request with a problem+json 401', async () => {
        const response = await server.inject('/api/v1/todos')
        expect(response.statusCode).toBe(401)
        expect(response.headers['content-type']).toContain(
            'application/problem+json',
        )
        expect(response.json()).toMatchObject({ status: 401 })
    })

    it('refuses an anonymous write', async () => {
        const response = await server.inject({
            method: 'POST',
            url: '/api/v1/todos',
            payload: { title: 'Anonymous' },
        })
        expect(response.statusCode).toBe(401)
    })

    it('documents the API routes and the auth routes', async () => {
        const response = await server.inject('/swagger/json')
        const paths = Object.keys(response.json().paths)
        expect(paths).toEqual(
            expect.arrayContaining([
                '/api/health/ping',
                '/api/v1/todos/',
                '/api/v1/todos/{id}',
                '/auth/sign-in/email',
            ]),
        )
    })
})
