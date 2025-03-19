import type { OpenAPIV3_1 } from 'openapi-types'
import { OpenAPIV3 } from 'openapi-types'
import fp from 'fastify-plugin'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastifyScalar from '@scalar/fastify-api-reference'
import { auth } from 'auth'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

const replaceTag = (
    item: OpenAPIV3_1.PathItemObject,
    oldTag: string,
    newTag: string,
) => {
    for (const method of Object.values(OpenAPIV3.HttpMethods)) {
        if (item[method] && item[method]?.tags?.indexOf(oldTag) !== -1) {
            item[method].tags = item[method].tags?.map((item) =>
                item === oldTag ? newTag : item,
            )
        }
    }
}

export const fastifyDocs = fp(
    (
        fastify,
        options: {
            title: string
            description: string
            version: string
        },
        done,
    ) => {
        auth.api.generateOpenAPISchema().then((openapi) => {
            fastify.register(fastifySwagger, {
                openapi: {
                    components: {
                        schemas: openapi.components.schemas,
                    },
                    paths: Object.keys(
                        openapi.paths,
                    ).reduce<OpenAPIV3_1.PathsObject>((acc, path) => {
                        const data = openapi.paths[
                            path
                        ] as unknown as OpenAPIV3_1.PathItemObject
                        replaceTag(data, 'Default', 'Auth')
                        acc[`${auth.options.basePath}${path}`] = data
                        return acc
                    }, {}),
                },
                transform: (data) => {
                    const { url, schema } = jsonSchemaTransform(data)
                    const toReturn = { ...schema }
                    if (url.includes(`${auth.options.basePath}/*`)) {
                        toReturn.hide = true
                    }
                    return {
                        schema: toReturn,
                        url,
                    }
                },
            })
            // Serve an OpenAPI file
            fastify.register(fastifySwaggerUi, {
                routePrefix: '/swagger',
                theme: {
                    title: options.title,
                },
            })
            fastify.register(fastifyScalar, {
                routePrefix: '/scalar',
                configuration: {
                    title: options.title,
                },
            })
            done()
        })
    },
)
