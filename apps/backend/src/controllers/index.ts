import type { Subject, Action } from 'ability'
import type { RouteConfig } from 'fastify-decorators'
import type { FastifyRequest } from 'fastify'
import { GET as BaseGET } from 'fastify-decorators'
import { z } from 'zod'
import { UnauthorizedError } from '~/plugins/fastifyProblemJson'
import { ability, subject } from 'ability'

export * from 'fastify-decorators'
export function GET(
    config: RouteConfig & {
        permissions?:
            | Partial<Record<Action, Subject>>
            | ((abilities: typeof ability, request: FastifyRequest) => void)
    },
) {
    // check if permissions are set
    if (!config.options) {
        config.options = {}
    }
    const preHandler = config.options.preHandler
    config.options.preHandler = function (request, reply, done) {
        if (config.permissions) {
            if (!request.user) {
                throw new UnauthorizedError(
                    "You're not authorized to access this",
                )
            }
            if (typeof config.permissions === 'function') {
                config.permissions(ability, request)
            } else {
                let action: keyof typeof config.permissions
                for (action in config.permissions) {
                    const actionSubject = config.permissions[action]
                    if (!actionSubject) {
                        continue
                    }
                    if (
                        !ability.can(
                            action,
                            request.body
                                ? subject(actionSubject, request.body)
                                : actionSubject,
                        )
                    ) {
                        throw new UnauthorizedError(
                            "You're not authorized to access this",
                        )
                    }
                }
            }
        }
        if (preHandler && typeof preHandler === 'function') {
            preHandler.bind(this)(request, reply, done)
            return
        }
        done()
    }
    // parse url params
    const params = config.url.match(/\/?:[_A-Z]\w*\??/gi)
    if (params && !config.options?.schema?.params) {
        config.options = config.options || {}
        config.options.schema = config.options.schema || {}
        config.options.schema.params = z.object(
            params.reduce<Record<string, z.ZodString>>((acc, param) => {
                const toReturn = z.string()
                let name = param.replace(/\/?:|\?/g, '')
                const optional = param.endsWith('?')
                if (optional) {
                    name = name.replace('?', '')
                    toReturn.optional()
                }
                acc[name] = toReturn
                return acc
            }, {}),
        )
    }
    return BaseGET(config)
}
