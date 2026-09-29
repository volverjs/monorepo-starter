# Gotchas

Failures that already cost a debugging session. Each entry: what breaks, why, what to do.

The entries live in one file per area under [gotchas/](gotchas/). Read the file for the area
you are about to touch, and add a new entry to that same file (a new area gets its own file and
a section here).

## [Dependencies](gotchas/dependencies.md)

- [TypeScript 7 cannot be adopted yet (as of 2026-09-29)](gotchas/dependencies.md#typescript-7-cannot-be-adopted-yet-as-of-2026-09-29)
- [pnpm refuses a version younger than a day, and the way it offers around it is not the fix](gotchas/dependencies.md#pnpm-refuses-a-version-younger-than-a-day-and-the-way-it-offers-around-it-is-not-the-fix)
- [better-auth is pinned exactly, and its CLI is another package](gotchas/dependencies.md#better-auth-is-pinned-exactly-and-its-cli-is-another-package)
- [pnpm ignores `onlyBuiltDependencies` without a warning](gotchas/dependencies.md#pnpm-ignores-onlybuiltdependencies-without-a-warning)

## [Database](gotchas/database.md)

- [`pnpm db:generate` can fail and still report success](gotchas/database.md#pnpm-dbgenerate-can-fail-and-still-report-success)
- [better-auth reports a missing column only at startup](gotchas/database.md#better-auth-reports-a-missing-column-only-at-startup)
- [The local Postgres port is shared with other projects](gotchas/database.md#the-local-postgres-port-is-shared-with-other-projects)
- [`drizzle.config.ts` runs as CommonJS](gotchas/database.md#drizzleconfigts-runs-as-commonjs)

## [Backend](gotchas/backend.md)

- [Response serialization is parse-based on purpose](gotchas/backend.md#response-serialization-is-parse-based-on-purpose)
- [One ability for the whole process judged each request with someone else's rules](gotchas/backend.md#one-ability-for-the-whole-process-judged-each-request-with-someone-elses-rules)
- [A route without `permissions` is public](gotchas/backend.md#a-route-without-permissions-is-public)
- [The permission check used to swallow the route's own hooks](gotchas/backend.md#the-permission-check-used-to-swallow-the-routes-own-hooks)
- [A permissions map with conditions judges the request body](gotchas/backend.md#a-permissions-map-with-conditions-judges-the-request-body)
- [A package the bundle imports must be a dependency of `apps/backend`](gotchas/backend.md#a-package-the-bundle-imports-must-be-a-dependency-of-appsbackend)
- [Annotating the better-auth config erases the plugins from the types](gotchas/backend.md#annotating-the-better-auth-config-erases-the-plugins-from-the-types)
- [A custom error handler logs nothing, and the shared logger is silent in production](gotchas/backend.md#a-custom-error-handler-logs-nothing-and-the-shared-logger-is-silent-in-production)

## [Frontend](gotchas/frontend.md)

- [vue-router 5 absorbed unplugin-vue-router](gotchas/frontend.md#vue-router-5-absorbed-unplugin-vue-router)
- [A missing `VITE_` variable is `undefined`, not an error](gotchas/frontend.md#a-missing-vite_-variable-is-undefined-not-an-error)
- [ESLint `ignores` are globs, and a catch-all page is not a plain path](gotchas/frontend.md#eslint-ignores-are-globs-and-a-catch-all-page-is-not-a-plain-path)

## [Tooling](gotchas/tooling.md)

- [Vitest does not typecheck](gotchas/tooling.md#vitest-does-not-typecheck)
- [The shell wins over `.env.local`, which wins over `.env`](gotchas/tooling.md#the-shell-wins-over-envlocal-which-wins-over-env)
- [`pnpm dev` of the frontend reloads once on a fresh install](gotchas/tooling.md#pnpm-dev-of-the-frontend-reloads-once-on-a-fresh-install)
