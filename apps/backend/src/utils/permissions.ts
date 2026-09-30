import type { SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import type {
    Action,
    AppAbility,
    CompoundCondition,
    Condition,
    FieldCondition,
    Subject,
} from 'ability'
import {
    and,
    eq,
    gt,
    gte,
    inArray,
    isNotNull,
    isNull,
    lt,
    lte,
    ne,
    not,
    notInArray,
    or,
    sql,
    is,
    Column,
} from 'drizzle-orm'
import { rulesToAST, subject } from 'ability'
import { ForbiddenError } from '~/plugins/fastifyProblemJson'

/**
 * Refuses with a 403 unless the ability allows `action` on this record. The
 * record is the stored row (or, for a create, the row about to be stored),
 * never the request body: a condition such as `{ createdBy: user.id }` judged
 * on the body would trust whatever the client wrote there.
 */
export const assertCan = (
    ability: AppAbility,
    action: Action,
    subjectType: Subject,
    record: object,
) => {
    if (!ability.can(action, subject(subjectType, record))) {
        throw new ForbiddenError("You're not allowed to do this")
    }
}

/**
 * The rows of `table` the ability allows `action` on, as a WHERE clause: the
 * conditions of the role files (packages/ability/src/roles) become SQL, so a
 * list returns exactly the rows `assertCan` would accept one by one. No rule
 * matches no row; a rule without conditions matches every row.
 */
export const accessibleBy = (
    ability: AppAbility,
    action: Action,
    subjectType: Subject,
    table: PgTable,
): SQL => {
    const condition = rulesToAST(ability, action, subjectType)
    if (!condition) {
        return sql`false`
    }
    return toSql(condition, table)
}

const isCompound = (condition: Condition): condition is CompoundCondition =>
    Array.isArray(condition.value) &&
    ['and', 'or', 'not'].includes(condition.operator)

// Only the operators the roles use today are translated, on columns of the
// table itself, with the Zod field names (`createdBy`): an unknown operator or
// field throws instead of silently widening the query.
// A compound with no children is a constant, never `undefined`: `and()` of
// nothing would vanish inside an `or`, and a rule without conditions next to
// one with conditions would shrink to the conditional one.
const toSql = (condition: Condition, table: PgTable): SQL => {
    if (isCompound(condition)) {
        const children = condition.value.map((child) => toSql(child, table))
        switch (condition.operator) {
            case 'and':
                return children.length ? and(...children)! : sql`true`
            case 'or':
                return children.length ? or(...children)! : sql`false`
            case 'not':
                return not(children.length ? and(...children)! : sql`true`)
        }
    }
    const { operator, field, value } = condition as FieldCondition
    const column = (table as unknown as Record<string, unknown>)[
        field as string
    ]
    if (!is(column, Column)) {
        throw new Error(`Permission condition on unknown column "${field}"`)
    }
    switch (operator) {
        case 'eq':
            return value === null ? isNull(column) : eq(column, value)
        case 'ne':
            return value === null ? isNotNull(column) : ne(column, value)
        case 'in':
            return inArray(column, value as unknown[])
        case 'nin':
            return notInArray(column, value as unknown[])
        case 'lt':
            return lt(column, value)
        case 'lte':
            return lte(column, value)
        case 'gt':
            return gt(column, value)
        case 'gte':
            return gte(column, value)
        default:
            throw new Error(
                `Permission condition operator "${operator}" is not translated to SQL`,
            )
    }
}
