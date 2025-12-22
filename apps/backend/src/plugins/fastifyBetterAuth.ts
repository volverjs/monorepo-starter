import type { HttpHeader } from 'fastify/types/utils'
import type { FastifyReply } from 'fastify'
import { toNodeHandler } from 'better-auth/node'
import fp from 'fastify-plugin'
import { auth } from 'auth'
import type { IncomingMessage } from 'node:http'

/**
 * Creates a clean headers object filtering out HTTP/2 pseudo-headers and symbols
 */
function createCleanHeaders(
    rawHeaders: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
    const cleanHeaders: Record<string, string | string[] | undefined> = {}
    const headerKeys = Object.getOwnPropertyNames(rawHeaders)

    for (const key of headerKeys) {
        if (!key.startsWith(':')) {
            const value = rawHeaders[key]
            if (value != null) {
                cleanHeaders[key.toLowerCase()] = value
            }
        }
    }

    return cleanHeaders
}

/**
 * Creates a Headers object from raw headers, filtering out invalid entries
 */
function createWebHeaders(
    rawHeaders: Record<string, string | string[] | undefined>,
): Headers {
    const headerEntries: [string, string][] = []
    const headerKeys = Object.getOwnPropertyNames(rawHeaders)

    for (const key of headerKeys) {
        if (!key.startsWith(':')) {
            const value = rawHeaders[key]
            if (value != null) {
                const stringValue = Array.isArray(value)
                    ? value.join(', ')
                    : String(value)
                headerEntries.push([key.toLowerCase(), stringValue])
            }
        }
    }

    return new Headers(headerEntries)
}

/**
 * Creates a proxy for the request object that returns clean headers
 */
function createRequestProxy(request: IncomingMessage): IncomingMessage {
    const cleanHeaders = createCleanHeaders(request.headers)

    return new Proxy(request, {
        get(target, prop) {
            if (prop === 'headers') {
                return cleanHeaders
            }
            const value = target[prop as keyof typeof target]
            if (typeof value === 'function') {
                return value.bind(target)
            }
            return value
        },
    })
}

/**
 * Sets response headers from a headers object
 */
function setResponseHeaders(
    reply: FastifyReply,
    headers: Record<HttpHeader, number | string | string[] | undefined>,
): void {
    for (const [key, value] of Object.entries(headers)) {
        if (value != null) {
            reply.raw.setHeader(key, value)
        }
    }
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
            // Create a proxy with clean headers to avoid symbol issues
            const requestProxy = createRequestProxy(request.raw)

            // Set response headers
            setResponseHeaders(reply, reply.getHeaders())

            await authHandler(requestProxy, reply.raw)
        })
    })

    fastify.addHook('onRequest', async (request) => {
        try {
            // Create clean headers for better-auth
            const headers = createWebHeaders(request.headers)

            const currentSession = await auth.api.getSession({ headers })

            request.user = currentSession?.user
            request.session = currentSession?.session
        } catch (error) {
            // Log error but don't break the request flow
            console.warn('Failed to get session:', error)
            request.user = undefined
            request.session = undefined
        }
    })

    done()
})
