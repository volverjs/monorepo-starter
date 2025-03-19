import fp from 'fastify-plugin'
import { FastifyError } from 'fastify'

export enum ERROR_STATUS {
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
}
export const UNAUTHORIZED = 'UNAUTHORIZED'
export const ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND'
export const FST_ERR_VALIDATION = 'FST_ERR_VALIDATION'
export const FST_ERR_NOT_FOUND = 'FST_ERR_NOT_FOUND'

export class EntityNotFoundError implements FastifyError {
    code = ENTITY_NOT_FOUND
    name = 'EntityNotFoundError'
    statusCode = ERROR_STATUS.NOT_FOUND
    constructor(public message: string = '') {}
}

export class UnauthorizedError implements FastifyError {
    code = UNAUTHORIZED
    name = 'UnauthorizedError'
    statusCode = ERROR_STATUS.UNAUTHORIZED
    constructor(public message: string = '') {}
}

export interface IProblemJsonError {
    type: string
    title: string
    status: number
    additionalData?: Record<string, unknown>
    message?: string
}

export class ProblemJsonError implements IProblemJsonError {
    type: string
    title: string
    status: number
    message?: string
    additionalData?: Record<string, unknown>

    constructor(data: IProblemJsonError) {
        this.type = data.type
        this.title = data.title
        this.status = data.status
        this.additionalData = data.additionalData
        this.message = data.message
    }

    toJson() {
        return {
            type: this.type,
            title: this.title,
            status: this.status,
            additionalData: this.additionalData,
            message: this.message,
        }
    }
}

interface IDataError {
    status?: number
    title?: string
    message?: string
}

export class ValidationProblemJsonError extends ProblemJsonError {
    constructor(
        { status, title }: IDataError,
        additionalData: Record<string, unknown>,
    ) {
        super({
            type: 'http://test.com/validation-error',
            title: title ?? 'Validation error',
            status: status ?? ERROR_STATUS.BAD_REQUEST,
            additionalData,
        })
    }
}

export class NotFoundProblemJsonError extends ProblemJsonError {
    constructor({ status, title }: IDataError) {
        super({
            type: 'http://test.com/not-found',
            title: title ?? 'Not found',
            status: status ?? ERROR_STATUS.NOT_FOUND,
        })
    }
}

export class EntityNotFoundProblemJsonError extends ProblemJsonError {
    constructor({ status, title }: IDataError, id: string) {
        super({
            type: 'http://test.com/entity-not-found',
            title: title ?? 'Entity not found',
            status: status ?? ERROR_STATUS.NOT_FOUND,
            additionalData: {
                id,
            },
        })
    }
}

export class InternalServerErrorProblemJson extends ProblemJsonError {
    constructor({ status, title, message }: IDataError) {
        super({
            type: 'http://test.com/internal-server-error',
            title: title ?? 'Internal server error',
            message,
            status: status ?? ERROR_STATUS.INTERNAL_SERVER_ERROR,
        })
    }
}
export class UnauthorizedProblemJsonError extends ProblemJsonError {
    constructor({ status, title }: IDataError) {
        super({
            type: 'http://test.com/unauthorized',
            title: title ?? 'Unauthorized',
            status: status ?? ERROR_STATUS.UNAUTHORIZED,
        })
    }
}

export const createError = (error: FastifyError) => {
    const { validation, message: title } = error
    const code = title === ENTITY_NOT_FOUND ? ENTITY_NOT_FOUND : error.code
    const status = error.statusCode ?? ERROR_STATUS.INTERNAL_SERVER_ERROR
    switch (code) {
        case FST_ERR_VALIDATION:
            return new ValidationProblemJsonError({ status }, { validation })
        case FST_ERR_NOT_FOUND:
            return new NotFoundProblemJsonError({ status })
        case UNAUTHORIZED:
            return new UnauthorizedProblemJsonError({ status, title })
        case ENTITY_NOT_FOUND:
            return new EntityNotFoundProblemJsonError({ status }, error.message)
        default:
            return new InternalServerErrorProblemJson({
                status,
                message: error.message,
            })
    }
}

export const fastifyProblemJson = fp((fastify, _opts, done) => {
    fastify.setErrorHandler((error, _request, reply) => {
        if (!process.env.VITE_PROD) {
            console.error(error)
        }
        const problem = createError(error)
        reply.header('Content-Type', 'application/problem+json')
        reply.status(problem.status).send(problem.toJson())
    })
    done()
})
