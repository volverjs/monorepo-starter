import type { FastifyError } from 'fastify'
import { describe, expect, it } from 'vitest'
import {
    EntityNotFoundError,
    UnauthorizedError,
    createError,
} from '~/plugins/fastifyProblemJson'

const fastifyError = (fields: Partial<FastifyError>) =>
    Object.assign(new Error(fields.message ?? ''), fields) as FastifyError

describe('createError', () => {
    it('maps a validation error to a 400 problem with the details', () => {
        const validation = [{ instancePath: '/title', message: 'Required' }]
        const problem = createError(
            fastifyError({
                code: 'FST_ERR_VALIDATION',
                statusCode: 400,
                validation: validation as FastifyError['validation'],
            }),
        )
        expect(problem.toJson()).toMatchObject({
            status: 400,
            title: 'Validation error',
            additionalData: { validation },
        })
    })

    it('carries the id of an entity that was not found', () => {
        const problem = createError(new EntityNotFoundError('42'))
        expect(problem.toJson()).toMatchObject({
            status: 404,
            additionalData: { id: '42' },
        })
    })

    it('keeps the message of an unauthorized error as title', () => {
        const problem = createError(new UnauthorizedError('Nope'))
        expect(problem.toJson()).toMatchObject({ status: 401, title: 'Nope' })
    })

    it('turns anything else into a 500', () => {
        const problem = createError(fastifyError({ message: 'boom' }))
        expect(problem.toJson()).toMatchObject({ status: 500, message: 'boom' })
    })
})
