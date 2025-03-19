import { customType } from 'drizzle-orm/pg-core'

export const jsonbArray = customType<{ data: unknown }>({
    dataType() {
        return 'jsonb'
    },
    toDriver(val) {
        return val as unknown
    },
    fromDriver(value) {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value) as unknown
            } catch {
                return {}
            }
        }
        return value as unknown
    },
})
