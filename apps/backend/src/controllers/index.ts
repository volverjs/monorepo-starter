import type { Subject, Action, AppAbility } from 'ability'
import type { Actor } from '~/services'
import type { RouteConfig } from 'fastify-decorators'
import type { FastifyRequest } from 'fastify'
import {
    DELETE as BaseDELETE,
    GET as BaseGET,
    PATCH as BasePATCH,
    POST as BasePOST,
    PUT as BasePUT,
} from 'fastify-decorators'
import * as z from 'zod'
import { ForbiddenError, UnauthorizedError } from '~/plugins/fastifyProblemJson'

export * from 'fastify-decorators'

export type RouteConfigWithPermissions = RouteConfig & {
    /**
     * Who may call the route. An anonymous request is refused first, with a
     * 401. A map then names the actions the route needs on a subject type, and
     * refuses with a 403 a role that has no rule for them at all. Conditions
     * (a user edits only their own todos) are not judged here, where there is
     * no row yet: the service judges the stored row (`utils/permissions.ts`).
     * A function receives the request's ability and throws or rejects to
     * refuse, usually with a `ForbiddenError`: it is awaited before the
     * handler runs.
     */
    permissions?:
        | Partial<Record<Action, Subject>>
        | ((
              ability: AppAbility,
              request: FastifyRequest,
          ) => void | Promise<void>)
}

const checkPermissions = async (
    permissions: NonNullable<RouteConfigWithPermissions['permissions']>,
    request: FastifyRequest,
) => {
    if (!request.user) {
        throw new UnauthorizedError("You're not authorized to access this")
    }
    if (typeof permissions === 'function') {
        await permissions(request.ability, request)
        return
    }
    let action: keyof typeof permissions
    for (action in permissions) {
        const actionSubject = permissions[action]
        if (!actionSubject) {
            continue
        }
        if (!request.ability.can(action, actionSubject)) {
            throw new ForbiddenError("You're not allowed to do this")
        }
    }
}

/**
 * The signed-in user and their ability, for a service call. Throws a 401 when
 * there is none, which a route with `permissions` has already refused: the
 * check is what narrows the type.
 */
export const getActor = (request: FastifyRequest): Actor => {
    if (!request.user) {
        throw new UnauthorizedError("You're not authorized to access this")
    }
    return { user: request.user, ability: request.ability }
}

/**
 * Adds the permission check in front of the route's own preHandler hooks and,
 * when the route declares no params schema, one string param per `:name` in the
 * url. Exported for the tests.
 */
export const withPermissions = (
    config: RouteConfigWithPermissions,
): RouteConfig => {
    config.options = config.options ?? {}
    const { permissions } = config
    if (permissions) {
        // An array, so Fastify runs every hook of the route itself, callback
        // style or async, one after the other and only if the check passed.
        const own = config.options.preHandler
        config.options.preHandler = [
            async (request: FastifyRequest) => {
                await checkPermissions(permissions, request)
            },
            ...(Array.isArray(own) ? own : own ? [own] : []),
        ]
    }
    const params = config.url.match(/\/?:[_A-Z]\w*\??/gi)
    if (params && !config.options.schema?.params) {
        config.options.schema = config.options.schema ?? {}
        config.options.schema.params = z.object(
            Object.fromEntries(
                params.map((param) => {
                    const name = param.replace(/\/?:|\?/g, '')
                    return [
                        name,
                        param.endsWith('?')
                            ? z.string().optional()
                            : z.string(),
                    ]
                }),
            ),
        )
    }
    return config
}

export const GET = (config: RouteConfigWithPermissions) =>
    BaseGET(withPermissions(config))
export const POST = (config: RouteConfigWithPermissions) =>
    BasePOST(withPermissions(config))
export const PUT = (config: RouteConfigWithPermissions) =>
    BasePUT(withPermissions(config))
export const PATCH = (config: RouteConfigWithPermissions) =>
    BasePATCH(withPermissions(config))
export const DELETE = (config: RouteConfigWithPermissions) =>
    BaseDELETE(withPermissions(config))
