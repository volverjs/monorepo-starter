import fp from 'fastify-plugin'
import { type AppAbility, createAbility } from 'ability'

export const fastifyAbility = fp((fastify, _options, done) => {
    // Fastify refuses an object as a request decorator default (it would be
    // shared by every request), so the slot starts empty and the hook fills it.
    fastify.decorateRequest('ability', null as unknown as AppAbility)

    // Registered after fastifyBetterAuth, so `request.user` is already set.
    // One instance per request, see `createAbility`.
    fastify.addHook('onRequest', async (request) => {
        request.ability = createAbility(request.user?.role)
    })

    done()
})
