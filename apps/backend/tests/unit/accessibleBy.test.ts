import { describe, expect, it } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import {
    type AbilityUser,
    Subject,
    createAbility,
    createAbilityFromRules,
} from 'ability'
import { todo } from 'database/schema'
import { accessibleBy } from '~/utils/permissions'

// The role conditions as SQL, without a database: the integration suite runs
// the same clauses against Postgres (tests/integration/todos.test.ts).
const where = (user: AbilityUser | null, action: 'read' | 'update' = 'read') =>
    new PgDialect().sqlToQuery(
        accessibleBy(createAbility(user), action, Subject.Todo, todo),
    )

// Combinations no role has yet, straight from CASL rules
const whereForRules = (rules: Parameters<typeof createAbilityFromRules>[0]) =>
    new PgDialect().sqlToQuery(
        accessibleBy(createAbilityFromRules(rules), 'read', Subject.Todo, todo),
    )

describe('accessibleBy', () => {
    it('limits a user to the rows they created', () => {
        const query = where({ id: 'alice', role: 'user' }, 'update')
        expect(query.sql).toBe('"todo"."created_by" = $1')
        expect(query.params).toEqual(['alice'])
    })

    it('gives an admin every row', () => {
        expect(where({ id: 'root', role: 'admin' }).sql).toBe('true')
    })

    it('keeps every row when a rule without conditions sits next to a conditional one', () => {
        const query = whereForRules([
            { action: 'read', subject: Subject.Todo },
            {
                action: 'read',
                subject: Subject.Todo,
                conditions: { createdBy: 'alice' },
            },
        ])
        expect(query.sql).toBe('true')
    })

    it('leaves out the rows a cannot rule names', () => {
        const query = whereForRules([
            { action: 'read', subject: Subject.Todo },
            {
                action: 'read',
                subject: Subject.Todo,
                inverted: true,
                conditions: { done: true },
            },
        ])
        expect(query.sql).toBe('not "todo"."done" = $1')
        expect(query.params).toEqual([true])
    })

    it('gives no row to a user without a role', () => {
        expect(where({ id: 'nobody' }).sql).toBe('false')
        expect(where(null).sql).toBe('false')
    })
})
