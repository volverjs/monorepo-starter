import type { FastifySerializerCompiler } from 'fastify/types/schema'
import { ResponseSerializationError } from 'fastify-type-provider-zod'
import { $ZodType, safeParse } from 'zod/v4/core'

/**
 * Parse-based response serializer: the fastify-type-provider-zod v6 semantics,
 * kept locally so a library upgrade cannot change them.
 *
 * Route handlers return raw database rows and rely on the response schema to
 * shape them: `.default()` fills a field a row does not have yet, and a
 * `.transform()` normalizes a stored value. Since v7 the library serializes
 * with `z.encode`, which runs the schema backward: defaults are not applied and
 * a one-way transform throws `ZodEncodeError`. Parsing keeps the contract every
 * schema here is written against.
 */
export const parseSerializerCompiler: FastifySerializerCompiler<unknown> =
    ({ schema, method, url }) =>
    (data) => {
        const result = safeParse(resolveSchema(schema), data)
        if (result.error) {
            throw new ResponseSerializationError(method, url, {
                cause: result.error,
            })
        }
        return JSON.stringify(result.data)
    }

function resolveSchema(maybeSchema: unknown): $ZodType {
    if (maybeSchema instanceof $ZodType) {
        return maybeSchema
    }
    if (
        typeof maybeSchema === 'object' &&
        maybeSchema !== null &&
        'properties' in maybeSchema &&
        maybeSchema.properties instanceof $ZodType
    ) {
        return maybeSchema.properties
    }
    throw new Error(
        `Invalid response schema for serialization: ${JSON.stringify(maybeSchema)}`,
    )
}
