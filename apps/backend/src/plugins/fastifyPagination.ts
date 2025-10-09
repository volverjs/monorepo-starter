import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'

export class PagedResponse<T> {
    items: T[]
    total: number

    constructor(items: T[], total: number) {
        this.items = items
        this.total = total
    }
}

export const DEFAULT_TOTAL_HEADER_KEY = 'X-Total-Count'

export const fastifyPagination = fp(
    (fastify, opts: { origin?: string; totalHeaderKey?: string }, done) => {
        const totalHeaderKey = opts.totalHeaderKey ?? DEFAULT_TOTAL_HEADER_KEY
        const origin = opts.origin ?? '*'

        // register fastify-cors
        fastify.register(fastifyCors, {
            origin,
            exposedHeaders: [totalHeaderKey],
            credentials: true,
            methods: [
                'GET',
                'HEAD',
                'POST',
                'PUT',
                'PATCH',
                'DELETE',
                'CONNECT',
                'OPTIONS',
                'TRACE',
            ],
        })

        // add hook to handle PagedResponse
        fastify.addHook(
            'preSerialization',
            (_request, reply, payload, done) => {
                if (payload instanceof PagedResponse) {
                    reply.header(totalHeaderKey, payload.total)
                    return done(null, payload.items)
                }
                done(null, payload)
            },
        )
        done()
    },
)
