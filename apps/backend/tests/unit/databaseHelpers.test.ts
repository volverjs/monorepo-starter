import { describe, expect, it } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { and } from 'drizzle-orm'
import { todo } from 'database/schema'
import {
    getFilters,
    getFullText,
    getIdsFilter,
    getOffsetAndLimit,
    getOrderBy,
} from 'database/helpers'

const dialect = new PgDialect()
const render = (...conditions: Parameters<typeof and>) =>
    dialect.sqlToQuery(and(...conditions)!)

describe('database helpers', () => {
    it('turns page number and size into offset and limit', () => {
        expect(
            getOffsetAndLimit({ 'page[number]': '3', 'page[size]': '20' }),
        ).toEqual({ offset: 40, limit: 20 })
        expect(getOffsetAndLimit({})).toEqual({ offset: 0, limit: 10 })
    })

    it('sorts by known columns and ignores unknown ones', () => {
        expect(getOrderBy({ sort: '-title,unknown' }, todo)).toHaveLength(1)
    })

    it('filters only on columns the table has', () => {
        const filters = getFilters(
            { 'filter[done]': 'true', 'filter[nope]': 'x' },
            todo,
        )
        expect(filters).toHaveLength(1)
        expect(render(...filters)).toMatchObject({
            sql: '"todo"."done" = $1',
            params: ['true'],
        })
    })

    it('splits a comma separated ids filter', () => {
        expect(render(getIdsFilter({ ids: 'a, b' }, todo))).toMatchObject({
            sql: '"todo"."id" in ($1, $2)',
            params: ['a', 'b'],
        })
        expect(getIdsFilter({}, todo)).toBeUndefined()
    })

    it('searches the full text columns case insensitively', () => {
        expect(
            render(getFullText({ 'filter[fullText]': 'milk' }, [todo.title])),
        ).toMatchObject({
            sql: '"todo"."title"::text ILIKE $1',
            params: ['%milk%'],
        })
    })
})
