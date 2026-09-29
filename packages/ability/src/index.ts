import type {
    MongoAbility,
    InferSubjects,
    RawRuleOf,
    ForcedSubject,
    FieldMatcher,
} from '@casl/ability'
import type { MongoQuery } from '@ucast/mongo2js'
import type { Action, Subject } from './types'
import { $or } from '@ucast/mongo2js'
import {
    AbilityBuilder,
    createMongoAbility,
    buildMongoQueryMatcher,
    Ability as PureAbility,
    createAliasResolver,
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

const abilityOptions = {
    conditionsMatcher,
    resolveAction,
    fieldMatcher,
}

export type AppAbility = PureAbility<[Action, AbilitySubject], MongoQuery>

export const isValidRole = (role: string): role is keyof typeof roles => {
    return role in roles
}

const rulesForRole = (role?: string | null): RawRuleOf<Ability>[] => {
    if (!role || !isValidRole(role)) {
        return DEFAULT_RULES
    }
    const { can, rules } = new AbilityBuilder<Ability>(createMongoAbility)
    roles[role].forEach(({ action, subject, fields, condition }) => {
        can(action, subject, fields, condition)
    })
    return rules
}

/**
 * A standalone ability for one role. The backend builds one per request
 * (`plugins/fastifyAbility.ts`): a shared instance rewritten by every request
 * would be read by the permission check of another request that awaited in
 * between, and that request would be judged with someone else's rules.
 */
export const createAbility = (role?: string | null): AppAbility =>
    new PureAbility<[Action, AbilitySubject], MongoQuery>(
        rulesForRole(role),
        abilityOptions,
    )

/**
 * The ability of the signed-in user in the browser: one user per tab, so one
 * instance, updated by `updateAbilityByUserRole` when the session changes.
 * Never use it on the server, use `request.ability` there.
 */
export const ability = createAbility()

export const updateAbilityByUserRole = (role?: string | null) => {
    ability.update(rulesForRole(role))
}

export * from './types'
