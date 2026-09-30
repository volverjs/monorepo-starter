import * as z from 'zod'

export type QueryStringFilter<T extends string = string> = `filter[${T}]`
export type Querystring = {
    'page[number]'?: number | string
    'page[size]'?: number | string
    sort?: string[] | string
    [filterKeys: QueryStringFilter]: unknown
    [otherKeys: string]: unknown
}

/**
 * The columns of `entityDefaultColumns` the server writes itself, for
 * `.omit()` on an insert schema: a client never sends them.
 */
export const serverManagedColumns = {
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    deleted: true,
    deletedAt: true,
    deletedBy: true,
} as const

/**
 * The soft delete columns, for `.omit()` on a select schema: the API never
 * returns a deleted row, so the flags say nothing to a client.
 */
export const softDeleteColumns = {
    deleted: true,
    deletedAt: true,
    deletedBy: true,
} as const

export const makeSortEnum = <const T extends string>(input: T) => {
    return [`${input}`, `-${input}`] as [T, `-${T}`]
}

export const makeSortEnums = <const T extends string>(input: readonly T[]) => {
    return input.flatMap((i) => makeSortEnum(i))
}

export const zodQs = {
    pagination: (defaultNumber = 1, defaultSize = 10) => {
        return {
            'page[number]': z.string().default(defaultNumber.toString()),
            'page[size]': z.string().default(defaultSize.toString()),
        }
    },
    /**
     * A querystring value is always a string: give a non-text column its own
     * schema (`z.stringbool()`, `z.coerce.number()`). postgres-js serializes a
     * boolean parameter as `value === true`, so the string 'true' would match
     * the rows where the column is false.
     */
    filter: <const T extends string>(
        input: T,
        schema: z.ZodType = z.string(),
    ) => {
        return { [`filter[${input}]`]: schema.optional() }
    },
    range: <const T extends string>(input: T) => {
        return {
            [`from[${input}]`]: z.string().optional(),
            [`to[${input}]`]: z.string().optional(),
        }
    },
    has: <const T extends string>(input: T) => {
        return { [`has[${input}]`]: z.stringbool().optional() }
    },
    fullText: () => {
        return { [`filter[fullText]`]: z.string().optional() }
    },
    ids: () => {
        return { ids: z.union([z.string(), z.array(z.string())]).optional() }
    },
    deleted: () => {
        return { 'filter[isDeleted]': z.stringbool().default(false) }
    },
    filters: <const T extends string>(input: readonly T[]) => {
        return input
            .map((i) => zodQs.filter(i))
            .reduce((a, b) => ({ ...a, ...b }))
    },
    sort: <const S extends string>(
        sort: S[],
        defaultSort: S | `-${S}` = sort[0],
    ) => {
        const sortEnums = makeSortEnums(sort) as [S, ...`-${S}`[]]
        return {
            // @ts-expect-error workaround for zod issue
            sort: z.enum(sortEnums).optional().default(defaultSort),
        }
    },
}
