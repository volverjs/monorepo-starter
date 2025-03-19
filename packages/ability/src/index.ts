import type {
    MongoAbility,
    InferSubjects,
    RawRuleOf,
    ForcedSubject,
} from '@casl/ability'
import type { MongoQuery } from '@ucast/mongo2js'
import type { Action, Subject } from './types'
import { $or } from '@ucast/mongo2js'
import {
    AbilityBuilder,
    createMongoAbility,
    buildMongoQueryMatcher,
    PureAbility,
    createAliasResolver,
    FieldMatcher,
} from '@casl/ability'
import { roles } from './roles'
export { subject } from '@casl/ability'

// action alias
const resolveAction = createAliasResolver({
    modify: ['read', 'update', 'delete'],
})

// subject
export type AbilitySubject =
    | InferSubjects<'all' | Subject, true>
    | ForcedSubject<InferSubjects<'all' | Subject, true>>
type Ability = MongoAbility<[Action, AbilitySubject]>

// default rules
const DEFAULT_RULES: RawRuleOf<Ability>[] = [
    { action: 'read', subject: 'all', inverted: true },
]

// matcher
const conditionsMatcher = buildMongoQueryMatcher({ $or })
const fieldMatcher: FieldMatcher = (fields) => (field) => fields.includes(field)

// ability
export const ability = new PureAbility<[Action, AbilitySubject], MongoQuery>(
    DEFAULT_RULES,
    {
        conditionsMatcher,
        resolveAction,
        fieldMatcher,
    },
)

export const isValidRole = (role: string): role is keyof typeof roles => {
    return role in roles
}

export const updateAbilityByUserRole = (role?: string) => {
    // reset ability
    if (!role || !isValidRole(role)) {
        ability.update(DEFAULT_RULES)
        return
    }

    const { can, build } = new AbilityBuilder<Ability>(createMongoAbility)
    roles[role].forEach(({ action, subject, fields, condition }) => {
        can(action, subject, fields, condition)
    })
    ability.update(
        build({
            conditionsMatcher,
            resolveAction,
            fieldMatcher,
        }).rules,
    )
}

export * from './types'
