import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { expect } from 'vitest'
import { database } from 'database'
import { user } from 'database/schema'

export type SignedIn = {
    id: string
    /** The session cookie, for `server.inject({ headers })` */
    headers: { cookie: string }
}

/**
 * A new user with a real better-auth session, through the same route the SPA
 * calls. Every call makes a different user, so test files running in parallel
 * never see each other's rows.
 */
export const signUp = async (
    server: FastifyInstance,
    role: 'user' | 'admin' = 'user',
): Promise<SignedIn> => {
    const response = await server.inject({
        method: 'POST',
        url: '/auth/sign-up/email',
        payload: {
            name: `Test ${role}`,
            email: `${role}-${randomUUID()}@example.test`,
            password: 'correct-horse-battery-staple',
        },
    })
    expect(response.statusCode).toBe(200)
    const { id } = response.json().user as { id: string }
    if (role === 'admin') {
        // Nobody can sign up as admin: the role is only ever set in the
        // database. The session reads the user again on every request.
        await database.update(user).set({ role }).where(eq(user.id, id))
    }
    const cookie = response.cookies
        .map(({ name, value }) => `${name}=${value}`)
        .join('; ')
    return { id, headers: { cookie } }
}
