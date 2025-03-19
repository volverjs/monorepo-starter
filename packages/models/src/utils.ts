import { z } from 'zod'

export type QueryStringFilter<T extends string = string> = `filter[${T}]`
export type Querystring = {
    'page[number]'?: number | string
    'page[size]'?: number | string
    sort?: string[] | string
    [filterKeys: QueryStringFilter]: unknown
    [otherKeys: string]: unknown
}

export const makeSortEnum = <const T extends string>(input: T) => {
    return [`${input}`, `-${input}`] as [T, `-${T}`]
}

export const makeSortEnums = <const T extends string>(input: readonly T[]) => {
    return input.flatMap((i) => makeSortEnum(i))
}

export const zodQs = {
    pagination: (defaultNumber = 1, defaultSize = 10) => {
        return {
            'page[number]': z.number().min(1).default(defaultNumber),
            'page[size]': z.number().min(1).default(defaultSize),
        }
    },
    filter: <const T extends string>(input: T) => {
        return { [`filter[${input}]`]: z.string().optional() }
    },
    range: <const T extends string>(input: T) => {
        return {
            [`from[${input}]`]: z.string().optional(),
            [`to[${input}]`]: z.string().optional(),
        }
    },
    has: <const T extends string>(input: T) => {
        return { [`has[${input}]`]: z.boolean().optional() }
    },
    fullText: () => {
        return { [`filter[fullText]`]: z.string().optional() }
    },
    ids: () => {
        return { ids: z.union([z.string(), z.array(z.string())]).optional() }
    },
    deleted: () => {
        return { 'filter[isDeleted]': z.boolean().default(false) }
    },
    filters: <const T extends string>(input: readonly T[]) => {
        return input
            .map((i) => zodQs.filter(i))
            .reduce((a, b) => ({ ...a, ...b }))
    },
    sort: <const S extends string>(sort: S[]) => {
        const sortEnums = makeSortEnums(sort) as [S, ...`-${S}`[]]
        return {
            sort: z.enum(sortEnums).optional().default(sortEnums[0]),
        }
    },
}
