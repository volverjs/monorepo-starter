import type { HttpHeader } from 'fastify/types/utils'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import fp from 'fastify-plugin'
import { auth } from 'auth'

export function mapHeaders(
    headers: Record<HttpHeader, number | string | string[] | undefined>,
) {
    const entries = Object.entries(headers)
    const map = new Map()
    for (const [headerKey, headerValue] of entries) {
        if (headerValue != null) {
            map.set(headerKey, headerValue)
        }
    }
    return map
}

export const fastifyBetterAuth = fp((fastify, _options, done) => {
    fastify.decorate('auth', auth)

    fastify.register((fastify) => {
        const authHandler = toNodeHandler(auth)

        fastify.addContentTypeParser(
            'application/json',
            (_request, _payload, parse) => {
                parse(null, null)
            },
        )

        fastify.all(`${auth.options.basePath}/*`, async (request, reply) => {
            reply.raw.setHeaders(mapHeaders(reply.getHeaders()))
            await authHandler(request.raw, reply.raw)
        })
    })

    fastify.addHook('onRequest', async (request) => {
        const currentSession = await auth.api.getSession({
            headers: fromNodeHeaders(request.headers),
        })
        request.user = currentSession?.user
        request.session = currentSession?.session
    })

    done()
})
