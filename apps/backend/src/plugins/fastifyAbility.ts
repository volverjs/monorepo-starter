import fp from 'fastify-plugin'
import { ability, updateAbilityByUserRole } from 'ability'

export const fastifyAbility = fp((fastify, _options, done) => {
    fastify.decorate('ability', ability)

    fastify.addHook('onRequest', async (request) => {
        if (!request.user) {
            return
        }
        updateAbilityByUserRole(request.user.role)
    })

    done()
})
