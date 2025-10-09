import Fastify from 'fastify'
import { fastifyMultipart } from '@fastify/multipart'
import { bootstrap } from 'fastify-decorators'
import { fastifyProblemJson } from './plugins/fastifyProblemJson'
import { fastifyPagination } from './plugins/fastifyPagination'
import { fastifyDocs } from './plugins/fastifyDocs'
import { fastifyBetterAuth } from './plugins/fastifyBetterAuth'
import {
    serializerCompiler,
    validatorCompiler,
} from 'fastify-type-provider-zod'
import { fastifyAbility } from './plugins/fastifyAbility'
import packageJson from '../package.json'

const app = async () => {
    const server = Fastify({
        logger: true,
    })

    // fastify-type-provider-zod
    server.setValidatorCompiler(validatorCompiler)
    server.setSerializerCompiler(serializerCompiler)

    // error handler
    server.register(fastifyProblemJson)

    // x-total-count header
    server.register(fastifyPagination, {
        origin: process.env.VITE_FRONTEND_URL,
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

    // run server
    if (!process.env.VITE_LOCAL) {
        console.log('Running server')
        server.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
            if (err) {
                console.error(err)
                process.exit(1)
            }
            console.log(`Server listening at ${address}`)
        })
    }
    await server.ready()
    return server
}

export const viteNodeApp = app()
