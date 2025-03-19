import type { Session } from 'auth'

declare module 'fastify' {
    interface FastifyRequest {
        user: Session['user'] | undefined
        session: Session['session'] | undefined
    }
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type Class<T = any> = new (...args: any[]) => T
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
