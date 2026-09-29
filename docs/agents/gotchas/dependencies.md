# Dependencies gotchas

Part of the [gotchas index](../gotchas.md): upgrades, the lockfile, pinned versions. Each entry:
what breaks, why, what to do.

## TypeScript 7 cannot be adopted yet (as of 2026-09-29)

TypeScript 7 (the Go compiler) ships no JavaScript compiler API. typescript-eslint 8.71.0 still
declares the peer `typescript ">=4.8.4 <6.1.0"`, and vue-tsc 3.3.11 still routes through
`@volar/typescript` 2.4.28, which needs that API. `ncu` offers 7.0.2 as a plain upgrade.

**Do:** keep `"typescript": "6.0.3"` (exact) in the root `package.json`; `.ncurc.yml` rejects it
so a bulk `ncu -u` cannot move it. Before retrying, check both peers:
`npm view typescript-eslint peerDependencies` and `npm view vue-tsc dependencies`.

## pnpm refuses a version younger than a day, and the way it offers around it is not the fix

pnpm 12 applies a minimum release age. On 2026-09-29 the upgrade asked for
`@typescript-eslint/eslint-plugin` 8.71.0 and `@scalar/fastify-api-reference` 1.72.2, both
published hours earlier: `pnpm install` succeeded by appending a `minimumReleaseAgeExclude`
list of twenty entries to `pnpm-workspace.yaml`. Removing the list is not enough afterwards:
the lockfile still holds the young versions, `pnpm install` answers "Lockfile is up to date",
`pnpm update` fails with "The lockfile contains entries that the active policies reject", and
deleting `pnpm-lock.yaml` alone does nothing because pnpm rebuilds it from
`node_modules/.pnpm/lock.yaml`.

**Do:** ask for the previous release (a caret range is enough: pnpm resolves the newest one old
enough), never commit `minimumReleaseAgeExclude`, and when the lockfile already holds a
rejected entry rebuild it with `pnpm clean --lockfile --yes && pnpm install`. Then run
`pnpm deps:duplicates`, since a fresh resolution can move anything.

## better-auth is pinned exactly, and its CLI is another package

Moving better-auth is not a plain bump: the tables it expects change between minors (see
[database.md](database.md#better-auth-reports-a-missing-column-only-at-startup)), and the schema
generator is no longer `@better-auth/cli` (frozen at 1.4.x) but the `auth` package, which must
run at the same version as the library. `pnpm auth:generate-schema` reads that version from the
root `package.json`, which is why the pin there is exact.

**Do:** move `better-auth` in the root and in `apps/backend/package.json` together, then
`pnpm auth:generate-schema`, then bring `packages/database/src/schema/Auth.ts` in line and
generate a migration.

## pnpm ignores `onlyBuiltDependencies` without a warning

pnpm 11 replaced `onlyBuiltDependencies` (and `neverBuiltDependencies`,
`ignoredBuiltDependencies`) with the `allowBuilds` map, and has ignored the old settings since
(the pnpm 12 changelog says so). A workspace migrated from pnpm 10 keeps a list that looks
active: this one did until 2026-09-29.

**Do:** allow a package's install scripts in `allowBuilds` in `pnpm-workspace.yaml` (or with
`pnpm approve-builds`), and do not bring the old list back.
