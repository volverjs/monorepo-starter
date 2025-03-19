import type { MongoQuery } from '@ucast/mongo2js'

export enum Audience {
    Backoffice = 'backoffice',
    Frontooffice = 'frontoffice',
}

export enum Subject {
    All = 'all',
    Todo = 'todo',
    User = 'user',
}

// action
export type Action =
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'manage'
    | 'impersonate'
    | 'access'
    | 'clone'

export type Capability = {
    audience: Audience
    action: Action
    subject: Subject
    fields?: string[]
    condition?: MongoQuery<never>
}
