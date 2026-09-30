import { describe, expect, it } from 'vitest'
import { Subject, createAbility, subject } from 'ability'

const alice = { id: 'alice', role: 'user' }
const aliceTodo = () => subject(Subject.Todo, { createdBy: 'alice' })
const bobTodo = () => subject(Subject.Todo, { createdBy: 'bob' })

describe('createAbility', () => {
    it('lets a user create todos and change only their own', () => {
        const ability = createAbility(alice)
        expect(ability.can('create', Subject.Todo)).toBe(true)
        for (const action of ['read', 'update', 'delete'] as const) {
            expect(ability.can(action, aliceTodo())).toBe(true)
            expect(ability.can(action, bobTodo())).toBe(false)
        }
        expect(ability.can('manage', Subject.User)).toBe(false)
    })

    it('lets an admin manage everything', () => {
        const ability = createAbility({ id: 'root', role: 'admin' })
        expect(ability.can('update', bobTodo())).toBe(true)
        expect(ability.can('delete', Subject.User)).toBe(true)
    })

    it('denies everything to an unknown or missing role', () => {
        for (const user of [
            undefined,
            null,
            { id: 'x' },
            { id: 'x', role: '' },
            { id: 'x', role: 'owner' },
        ]) {
            const ability = createAbility(user)
            expect(ability.can('read', Subject.Todo)).toBe(false)
            expect(ability.can('create', Subject.Todo)).toBe(false)
        }
    })

    it('returns independent instances, one per request', () => {
        // The regression this guards: a single instance rewritten per request
        // let a concurrent request be judged with another user's rules.
        const bob = createAbility({ id: 'bob', role: 'user' })
        const aliceAbility = createAbility(alice)
        expect(bob.can('update', bobTodo())).toBe(true)
        expect(aliceAbility.can('update', bobTodo())).toBe(false)
    })
})
