import type { FastifyInstance } from 'fastify'
import type { SnapshotService } from '~/services/snapshot.service'
import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { createAbility } from 'ability'
import { database } from 'database'
import { snapshot, todo as todoTable, user } from 'database/schema'
import { buildServer } from '~/app'
import { TodoService } from '~/services/todo.service'
import { type SignedIn, signUp } from './helpers'

// The reference resource end to end: routes, permissions, service and SQL on
// a real Postgres. A new resource copies this file along with the service.
describe('todos', () => {
    let server: FastifyInstance
    let alice: SignedIn
    let bob: SignedIn
    let admin: SignedIn

    beforeAll(async () => {
        server = await buildServer({ logger: false })
        ;[alice, bob, admin] = await Promise.all([
            signUp(server),
            signUp(server),
            signUp(server, 'admin'),
        ])
    })

    afterAll(async () => {
        await server.close()
    })

    const create = (who: SignedIn, payload: Record<string, unknown>) =>
        server.inject({
            method: 'POST',
            url: '/api/v1/todos',
            headers: who.headers,
            payload,
        })

    const createTitled = async (who: SignedIn, title: string, done = false) =>
        (await create(who, { title, done })).json() as {
            id: string
            title: string
        }

    const list = (who: SignedIn, query: Record<string, string> = {}) =>
        server.inject({
            method: 'GET',
            url: '/api/v1/todos',
            query,
            headers: who.headers,
        })

    it('creates a todo owned by the caller, whatever the body claims', async () => {
        const response = await create(alice, {
            title: '  Buy milk  ',
            createdBy: bob.id,
            deleted: true,
        })
        expect(response.statusCode).toBe(200)
        const todo = response.json()
        expect(todo).toMatchObject({
            title: 'Buy milk',
            done: false,
            notes: null,
            createdBy: alice.id,
        })
        expect(todo).not.toHaveProperty('deleted')
        expect(new Date(todo.createdAt).toString()).not.toBe('Invalid Date')
    })

    it('refuses an invalid body with a problem+json 400', async () => {
        const response = await create(alice, { title: '   ' })
        expect(response.statusCode).toBe(400)
        expect(response.headers['content-type']).toContain(
            'application/problem+json',
        )
    })

    it("lists the caller's todos only, paged, with the total in a header", async () => {
        const carol = await signUp(server)
        for (const title of ['one', 'two', 'three']) {
            await createTitled(carol, title)
        }
        await createTitled(bob, 'not for carol')

        const response = await list(carol, { 'page[size]': '2' })
        expect(response.statusCode).toBe(200)
        expect(response.headers['x-total-count']).toBe('3')
        const items = response.json() as { createdBy: string }[]
        expect(items).toHaveLength(2)
        expect(items.every((item) => item.createdBy === carol.id)).toBe(true)
    })

    it('filters, searches and sorts', async () => {
        const dave = await signUp(server)
        await createTitled(dave, 'Paint the fence', true)
        await createTitled(dave, 'Paint the door')
        await createTitled(dave, 'Water the plants', true)

        const done = await list(dave, { 'filter[done]': 'true', sort: 'title' })
        expect(
            done.json().map((todo: { title: string }) => todo.title),
        ).toEqual(['Paint the fence', 'Water the plants'])

        const search = await list(dave, {
            'filter[fullText]': 'paint',
            sort: '-title',
        })
        expect(
            search.json().map((todo: { title: string }) => todo.title),
        ).toEqual(['Paint the fence', 'Paint the door'])
    })

    it("answers 404 for someone else's todo, as if it did not exist", async () => {
        const todo = await createTitled(alice, 'Private')
        const url = `/api/v1/todos/${todo.id}`
        const requests = [
            { method: 'GET' as const, url },
            { method: 'PUT' as const, url, payload: { title: 'Mine now' } },
            { method: 'DELETE' as const, url },
        ]
        for (const request of requests) {
            const response = await server.inject({
                ...request,
                headers: bob.headers,
            })
            expect(response.statusCode, request.method).toBe(404)
        }
    })

    it('lets an admin read and change any todo', async () => {
        const todo = await createTitled(alice, 'Reviewed by an admin')
        const response = await server.inject({
            method: 'PUT',
            url: `/api/v1/todos/${todo.id}`,
            headers: admin.headers,
            payload: { title: 'Reviewed', done: true },
        })
        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchObject({
            title: 'Reviewed',
            done: true,
            createdBy: alice.id,
            updatedBy: admin.id,
        })
    })

    it('soft deletes: the todo is gone from reads, writes and lists', async () => {
        const todo = await createTitled(alice, 'Short lived')
        const url = `/api/v1/todos/${todo.id}`
        const remove = await server.inject({
            method: 'DELETE',
            url,
            headers: alice.headers,
        })
        expect(remove.statusCode).toBe(200)
        expect(remove.json()).toBe(true)

        const read = await server.inject({ url, headers: alice.headers })
        expect(read.statusCode).toBe(404)
        const write = await server.inject({
            method: 'PUT',
            url,
            headers: alice.headers,
            payload: { title: 'Back from the dead' },
        })
        expect(write.statusCode).toBe(404)
        const listed = await list(alice, { ids: todo.id })
        expect(listed.json()).toEqual([])
    })

    it('keeps a snapshot of every write', async () => {
        const todo = await createTitled(alice, 'Audited')
        const url = `/api/v1/todos/${todo.id}`
        await server.inject({
            method: 'PUT',
            url,
            headers: alice.headers,
            payload: { title: 'Audited twice' },
        })
        await server.inject({ method: 'DELETE', url, headers: alice.headers })

        const rows = await database
            .select({ scope: snapshot.scope, createdBy: snapshot.createdBy })
            .from(snapshot)
            .where(eq(snapshot.entityId, todo.id))
            .orderBy(snapshot.createdAt)
        expect(rows).toEqual([
            { scope: 'create', createdBy: alice.id },
            { scope: 'update', createdBy: alice.id },
            { scope: 'delete', createdBy: alice.id },
        ])
    })

    it('rolls a write back when its snapshot fails', async () => {
        // The service without the HTTP layer, with a snapshot that always fails
        const failing = {
            create: () => Promise.reject(new Error('snapshot failed')),
        } as unknown as SnapshotService
        const service = new TodoService(database, failing)
        const owner = await database.query.user.findFirst({
            where: eq(user.id, alice.id),
        })
        if (!owner) {
            throw new Error('alice is not in the database')
        }
        const actor = { user: owner, ability: createAbility(owner) }
        const title = `Rolled back ${randomUUID()}`

        await expect(service.create({ title }, actor)).rejects.toThrow(
            'snapshot failed',
        )
        expect(
            await database.$count(todoTable, eq(todoTable.title, title)),
        ).toBe(0)

        const kept = await createTitled(alice, 'Kept as it was')
        await expect(service.update(kept.id, { title }, actor)).rejects.toThrow(
            'snapshot failed',
        )
        await expect(service.delete(kept.id, actor)).rejects.toThrow(
            'snapshot failed',
        )
        const stored = await database.query.todo.findFirst({
            where: eq(todoTable.id, kept.id),
        })
        expect(stored).toMatchObject({
            title: 'Kept as it was',
            deleted: false,
        })
    })

    it('refuses an id that is not a uuid with a 400', async () => {
        const response = await server.inject({
            url: '/api/v1/todos/not-a-uuid',
            headers: alice.headers,
        })
        expect(response.statusCode).toBe(400)
    })
})
