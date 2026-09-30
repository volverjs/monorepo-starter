import Fastify, { type FastifyServerOptions } from 'fastify'
import { fastifyMultipart } from '@fastify/multipart'
import { bootstrap } from 'fastify-decorators'
import { validatorCompiler } from 'fastify-type-provider-zod'
import { fastifyProblemJson } from './plugins/fastifyProblemJson'
import { fastifyPagination } from './plugins/fastifyPagination'
import { fastifyDocs } from './plugins/fastifyDocs'
import { fastifyBetterAuth } from './plugins/fastifyBetterAuth'
import { fastifyAbility } from './plugins/fastifyAbility'
import { parseSerializerCompiler } from './utils/responseSerializer'
import packageJson from '../package.json'

/**
 * Build the Fastify instance with every plugin and controller registered, and
 * wait for it to be ready. It never listens: `main.ts` does that in production,
 * vite-plugin-node in development, and tests call `server.inject()` on it.
 */
export const buildServer = async (options: FastifyServerOptions = {}) => {
    const server = Fastify({
        logger: true,
        ...options,
    })

    // fastify-type-provider-zod. Responses are serialized by parsing them with
    // the route schema, see ~/utils/responseSerializer.ts for why the library
    // default (encode-based since v7) is not used.
    server.setValidatorCompiler(validatorCompiler)
    server.setSerializerCompiler(parseSerializerCompiler)

    // error handler
    server.register(fastifyProblemJson)

    // x-total-count header
    server.register(fastifyPagination, {
        origin: process.env.FRONTEND_URL,
    })

    // multipart (for media upload)
    server.register(fastifyMultipart)

    // fastify-docs (swagger and scalar)
    server.register(fastifyDocs, {
        title: packageJson.name,
        description: packageJson.description,
        version: packageJson.version,
    })

    // auth
    server.register(fastifyBetterAuth)

    // ability
    server.register(fastifyAbility)

    // controllers
    const controllers = Object.values(
        import.meta.glob('./controllers/*.controller.ts', {
            eager: true,
        }) as Record<string, { default: Class }>,
    ).map((item) => item.default)
    server.register(bootstrap, {
        prefix: '/api',
        controllers,
    })

    await server.ready()
    return server
}
