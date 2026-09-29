import { describe, expect, it } from 'vitest'
import * as z from 'zod'
import { parseSerializerCompiler } from '~/utils/responseSerializer'

const serializerFor = (schema: z.ZodType) =>
    parseSerializerCompiler({ schema, method: 'GET', url: '/test' })

describe('parseSerializerCompiler', () => {
    it('applies defaults, which an encode-based serializer skips', () => {
        const serialize = serializerFor(
            z.object({ title: z.string(), done: z.boolean().default(false) }),
        )
        expect(JSON.parse(serialize({ title: 'Write tests' }))).toEqual({
            title: 'Write tests',
            done: false,
        })
    })

    it('strips fields the schema does not declare', () => {
        const serialize = serializerFor(z.object({ id: z.string() }))
        expect(JSON.parse(serialize({ id: '1', password: 'secret' }))).toEqual({
            id: '1',
        })
    })

    it('refuses a response that does not match the schema', () => {
        const serialize = serializerFor(z.object({ id: z.string() }))
        expect(() => serialize({ id: 1 })).toThrow(
            "Response doesn't match the schema",
        )
    })
})
