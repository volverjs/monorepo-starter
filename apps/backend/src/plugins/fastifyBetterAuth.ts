import { toNodeHandler } from 'better-auth/node'
import fp from 'fastify-plugin'
import { auth } from 'auth'

/**
 * Filters headers by removing HTTP/2 pseudo-headers (those starting with ':')
 * and converts to a Headers object compatible with better-auth
 */
function toHeaders(headers: Record<string, unknown>): Headers {
    const result = new Headers()
    for (const [key, value] of Object.entries(headers)) {
        if (key[0] !== ':' && value != null) {
            result.set(key, Array.isArray(value) ? value[0] : String(value))
        }
    }
    return result
}

/**
 * Filters headers by removing HTTP/2 pseudo-headers (those starting with ':')
 * and returns a plain object for Node.js request proxy
 */
function toPlainHeaders(
    headers: Record<string, unknown>,
): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
        if (key[0] !== ':' && value != null) {
            result[key] = Array.isArray(value) ? value[0] : String(value)
        }
    }
    return result
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
            const cleanHeaders = toPlainHeaders(request.headers)

            // Create a proxy request with sanitized headers
            const proxyRequest = Object.create(request.raw, {
                headers: { value: cleanHeaders, writable: true },
            })

            // Copy already set headers to the reply
            for (const [key, value] of Object.entries(reply.getHeaders())) {
                if (value != null) {
                    reply.raw.setHeader(key, value)
                }
            }

            await authHandler(proxyRequest, reply.raw)
        })
    })

    fastify.addHook('onRequest', async (request) => {
        const cleanHeaders = toHeaders(request.headers)

        const currentSession = await auth.api.getSession({
            headers: cleanHeaders,
        })

        request.user = currentSession?.user
        request.session = currentSession?.session
    })

    done()
})
