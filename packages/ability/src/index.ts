import type {
    MongoAbility,
    InferSubjects,
    RawRuleOf,
    ForcedSubject,
    FieldMatcher,
} from '@casl/ability'
import type { MongoQuery } from '@ucast/mongo2js'
import type { AbilityUser, Action, Subject } from './types'
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
export { rulesToAST } from '@casl/ability/extra'
export type {
    Condition,
    CompoundCondition,
    FieldCondition,
} from '@ucast/mongo2js'

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

const rulesFor = (user?: AbilityUser | null): RawRuleOf<Ability>[] => {
    if (!user?.role || !isValidRole(user.role)) {
        return DEFAULT_RULES
    }
    const { can, rules } = new AbilityBuilder<Ability>(createMongoAbility)
    roles[user.role](user).forEach(({ action, subject, fields, condition }) => {
        can(action, subject, fields, condition)
    })
    return rules
}

/**
 * An ability from raw CASL rules, with the matchers of the roles: for tests
 * of combinations no role has yet.
 */
export const createAbilityFromRules = (
    rules: RawRuleOf<Ability>[],
): AppAbility =>
    new PureAbility<[Action, AbilitySubject], MongoQuery>(rules, abilityOptions)

/**
 * A standalone ability for one user. The backend builds one per request
 * (`plugins/fastifyAbility.ts`): a shared instance rewritten by every request
 * would be read by the permission check of another request that awaited in
 * between, and that request would be judged with someone else's rules.
 */
export const createAbility = (user?: AbilityUser | null): AppAbility =>
    createAbilityFromRules(rulesFor(user))

/**
 * The ability of the signed-in user in the browser: one user per tab, so one
 * instance, updated by `updateAbility` when the session changes. Never use it
 * on the server, use `request.ability` there.
 */
export const ability = createAbility()

export const updateAbility = (user?: AbilityUser | null) => {
    ability.update(rulesFor(user))
}

export * from './types'
