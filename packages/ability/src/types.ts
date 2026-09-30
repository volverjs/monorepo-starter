import type { MongoQuery } from '@ucast/mongo2js'

export enum Audience {
    Backoffice = 'backoffice',
    Frontoffice = 'frontoffice',
}

export enum Subject {
    All = 'all',
    Todo = 'todo',
    User = 'user',
}

// action (`modify` is an alias of read, update and delete, see index.ts)
export type Action =
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'modify'
    | 'manage'
    | 'impersonate'
    | 'access'
    | 'clone'

export type Capability = {
    audience: Audience
    action: Action
    subject: Subject
    fields?: string[]
    /**
     * Matched against the record, with the field names of the Zod models
     * (`createdBy`, not `created_by`). The backend applies it twice: to the
     * stored row before a write, and as the WHERE clause of every list
     * (apps/backend/src/utils/permissions.ts).
     */
    condition?: MongoQuery
}

/** Who the rules are built for: the signed-in user, or nobody. */
export type AbilityUser = {
    id: string
    role?: string | null
}

/** A role is a function of the user, so a condition can name the user's own id. */
export type Role = (user: AbilityUser) => Capability[]
