import { describe, expect, it } from 'vitest'
import { Subject, createAbility } from 'ability'

describe('createAbility', () => {
    it('lets a user read todos and nothing more', () => {
        const ability = createAbility('user')
        expect(ability.can('read', Subject.Todo)).toBe(true)
        expect(ability.can('create', Subject.Todo)).toBe(false)
        expect(ability.can('manage', Subject.User)).toBe(false)
    })

    it('lets an admin manage everything', () => {
        const ability = createAbility('admin')
        expect(ability.can('create', Subject.Todo)).toBe(true)
        expect(ability.can('delete', Subject.User)).toBe(true)
    })

    it('denies everything to an unknown or missing role', () => {
        for (const role of [undefined, null, '', 'owner']) {
            const ability = createAbility(role)
            expect(ability.can('read', Subject.Todo)).toBe(false)
        }
    })

    it('returns independent instances, one per request', () => {
        // The regression this guards: a single instance rewritten per request
        // let a concurrent request be judged with another user's rules.
        const admin = createAbility('admin')
        const user = createAbility('user')
        expect(admin.can('create', Subject.Todo)).toBe(true)
        expect(user.can('create', Subject.Todo)).toBe(false)
    })
})
