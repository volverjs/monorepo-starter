import {
    type SQL,
    type AnyTable,
    type AnyColumn,
    type TableConfig,
    type View,
    type Subquery,
    asc,
    desc,
    and,
    or,
    isNull,
    gte,
    lte,
    isNotNull,
    sql,
    eq,
    inArray,
} from 'drizzle-orm'
import { type Querystring } from 'models'

export const getPageNumberAndPageSize = (params: Querystring) => {
    const pageNumber = !Number.isNaN(Number(params['page[number]']))
        ? Number(params['page[number]'])
        : 1
    const pageSize = !Number.isNaN(Number(params['page[size]']))
        ? Number(params['page[size]'])
        : 10
    return {
        pageNumber,
        pageSize,
    }
}

export const getOffsetAndLimit = (params: Querystring) => {
    const { pageNumber, pageSize } = getPageNumberAndPageSize(params)
    return {
        offset: (pageNumber - 1) * pageSize,
        limit: pageSize,
    }
}

export const getOrderBy = <T extends Subquery | AnyTable<TableConfig>>(
    params: Querystring,
    table: T,
) => {
    let sort = Array.isArray(params.sort)
        ? params.sort
        : params.sort?.split(',')

    if ((!sort || sort.length === 0) && 'updated_at' in table) {
        sort = ['-updated_at']
    }
    if (!sort) {
        return []
    }
    return sort?.reduce<SQL[]>((acc, item) => {
        const isDesc = item.startsWith('-')
        const columnKey = isDesc ? item.substring(1) : item
        const column = table[columnKey as keyof T] as AnyColumn
        if (!column) {
            return acc
        }
        acc.push(isDesc ? desc(column) : asc(column))
        return acc
    }, [])
}

export const getFilters = <T extends AnyTable<TableConfig> | View>(
    params: Querystring,
    table: T,
    options?: {
        exclude?: string[]
        include?: string[]
    },
) => {
    return Object.keys(params)
        .filter((key) => {
            const tableKey = key.substring(7, key.length - 1)
            return (
                key.startsWith('filter[') &&
                key !== 'filter[fullText]' &&
                params[key] !== undefined &&
                params[key] !== null &&
                params[key] !== '' &&
                tableKey in table &&
                (!options ||
                    !options.exclude ||
                    !options.exclude.includes(tableKey)) &&
                (!options ||
                    !options.include ||
                    options.include.includes(tableKey))
            )
        })
        .map((key) =>
            eq(
                table[key.substring(7, key.length - 1) as keyof T] as AnyColumn,
                params[key],
            ),
        )
}

export const getIdsFilter = <T extends AnyTable<TableConfig> | View>(
    params: Querystring,
    table: T,
) => {
    const idsParam = params['ids']
    if (!idsParam) {
        return undefined
    }
    const ids = Array.isArray(idsParam)
        ? idsParam
        : typeof idsParam === 'string'
          ? idsParam.split(',').map((id) => id.trim())
          : []
    if (ids.length === 0) {
        return undefined
    }

    return inArray(table['id' as keyof T] as AnyColumn, ids)
}

export const getRange = <T extends AnyTable<TableConfig> | View>(
    params: Querystring,
    table: T,
) => {
    return Object.keys(params)
        .filter((key) => {
            const tableKey = key.substring(5, key.length - 1)
            return (
                key.startsWith('from[') &&
                params[key] !== undefined &&
                params[key] !== null &&
                params[key] !== '' &&
                tableKey in table
            )
        })
        .map((key) =>
            gte(
                table[key.substring(5, key.length - 1) as keyof T] as AnyColumn,
                params[key],
            ),
        )
        .concat(
            Object.keys(params)
                .filter((key) => {
                    const tableKey = key.substring(3, key.length - 1)
                    return (
                        key.startsWith('to[') &&
                        params[key] !== undefined &&
                        params[key] !== null &&
                        params[key] !== '' &&
                        tableKey in table
                    )
                })
                .map((key) =>
                    lte(
                        table[
                            key.substring(3, key.length - 1) as keyof T
                        ] as AnyColumn,
                        params[key],
                    ),
                ),
        )
}

export const getHas = <T extends AnyTable<TableConfig> | View>(
    params: Querystring,
    table: T,
) => {
    return Object.keys(params)
        .filter((key) => {
            const tableKey = key.substring(4, key.length - 1)
            return (
                key.startsWith('has[') &&
                params[key] !== undefined &&
                params[key] !== null &&
                params[key] !== '' &&
                tableKey in table
            )
        })
        .map((key) =>
            isNotNull(
                table[key.substring(4, key.length - 1) as keyof T] as AnyColumn,
            ),
        )
}

export const getInclude = <T extends AnyTable<TableConfig> | View>(
    params: Querystring,
    table: T,
    column: keyof T = 'customerId' as keyof T,
) => {
    if (params[`filter[${column as string}]`]) {
        return undefined
    }
    const defaultValue = isNull(table[column] as AnyColumn)
    if (!params[`include[${column as string}]`]) {
        return defaultValue
    }
    return or(
        defaultValue,
        eq(table[column] as AnyColumn, params[`include[${column as string}]`]),
    )
}

export const getFullText = (params: Querystring, columns: AnyColumn[]) => {
    const value = params['filter[fullText]']
    if (!value) {
        return undefined
    }
    const querySearchString = `%${value}%`
    return or(
        ...columns.map(
            (column) => sql`${column}::text ILIKE ${querySearchString}`,
        ),
    )
}

export const querystringToSelect = (
    params: Querystring,
    table: AnyTable<TableConfig>,
    {
        exclude = [],
        fullTextColumns = [],
    }: {
        exclude?: ('where' | 'pagination' | 'orderBy')[]
        fullTextColumns?: AnyColumn[]
    } = {},
) => {
    const toReturn: {
        offset?: number
        limit?: number
        orderBy?: SQL[]
        where?: SQL
    } = {}
    // offset and limit
    if (!exclude.includes('pagination')) {
        const offsetAndLimit = getOffsetAndLimit(params)
        toReturn.offset = offsetAndLimit.offset
        toReturn.limit = offsetAndLimit.limit
    }

    // order by
    if (!exclude.includes('orderBy')) {
        toReturn.orderBy = getOrderBy(params, table)
    }

    // where
    if (!exclude.includes('where')) {
        const fullText = getFullText(params, fullTextColumns)
        toReturn.where = and(...getFilters(params, table), fullText)
    }
    return toReturn
}
