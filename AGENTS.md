# @volverjs/monorepo-starter

<!-- scaffold:intro -->
Nx + pnpm monorepo template for full-stack web apps: a Vue 3 SPA built on the Volver design
system, a Fastify API, PostgreSQL through Drizzle ORM and authentication with better-auth. New
projects are generated from it with the `volverjs-monorepo-starter` skill
([skills/volverjs-monorepo-starter/](skills/volverjs-monorepo-starter/SKILL.md)), so everything
here is also what a new project starts with.
<!-- /scaffold:intro -->

## Documentation map

| Need | Where |
| --- | --- |
| Traps that already cost debugging time, one file per area | [docs/agents/gotchas.md](docs/agents/gotchas.md) |
| Adding a resource end to end by copying `todo` (table, models, permissions, service, controller, tests, store, pages) | [docs/agents/new-resource.md](docs/agents/new-resource.md) |
| Seeing a UI change on the running app, both themes, console errors included | [docs/agents/ui-tour.md](docs/agents/ui-tour.md) |
| Human-facing overview | [README.md](README.md) |

Before non-trivial work, read the gotchas file of the area you touch. Each entry maps to a
failure that already happened once.

## Agent skills

- **Volver** skills live in each `volverjs/<package>` repository, next to the library they
  document: `volverjs-style`, `volverjs-ui-vue`, `volverjs-data`, `volverjs-query-vue`,
  `volverjs-form-vue`, `volverjs-zod-vue-i18n`. Claude Code receives them as plugins (see
  [CLAUDE.md](CLAUDE.md)); other agents install them with `npx skills add volverjs/<package> -g`.
- **Third-party** skills the project relies on (Vue, Pinia, Vite, Vitest, pnpm, Fastify, Node,
  TypeScript) are pinned in [skills-lock.json](skills-lock.json) and installed per machine with
  `npx skills experimental_install`. Add, update or remove them with the `skills` CLI
  (`npx skills add`, `update`, `remove`), never by hand in `.claude/skills/` or `.agents/skills/`.
<!-- starter-only -->
- **This repository publishes one skill**, [skills/volverjs-monorepo-starter/](skills/volverjs-monorepo-starter/),
  which scaffolds a new project from this template. It is listed as a plugin by
  [.claude-plugin/plugin.json](.claude-plugin/plugin.json). Change it here: a copy edited
  anywhere else is lost at the next update. When the template changes (a package renamed, an
  env variable added, a script moved), update the skill and its `scripts/scaffold.mjs` in the
  same change: `pnpm verify` runs `pnpm scaffold:check`, which scaffolds a throwaway copy of
  this working tree and fails when an edit the script makes no longer applies.
- Text between `starter-only` markers in AGENTS.md and CLAUDE.md is about the template itself:
  the scaffold removes it from the new project.
<!-- /starter-only -->

## Working with Nx

- Run tasks through Nx or the root scripts with the pnpm prefix (`pnpm nx run backend:test`,
  `pnpm verify`), never the underlying tool. A PreToolUse hook
  ([.claude/hooks/guard.mjs](.claude/hooks/guard.mjs)) refuses `vitest`, `tsc`, `vue-tsc`, `vite`
  and `drizzle-kit` run directly.
- Nx infers the targets of each project from the `scripts` of its `package.json`; caching and
  `dependsOn` live in [nx.json](nx.json). `typecheck`, `test` and `dev` depend on `^build`
  because the frontend imports `packages/icons/dist/custom.json`, which only `icons:build`
  produces.
- The Nx MCP server (`nx-mcp` in [.mcp.json](.mcp.json)) answers questions about the project
  graph and Nx options: prefer it, or `--help`, over guessing flags.

## Local setup

Prerequisites: Node.js 24.12 or newer (22.20 or newer on the 22 line), pnpm (the version in `packageManager`
is fetched automatically), Docker.

```bash
docker compose up -d postgres   # Postgres 18 (PgAdmin too: docker compose up -d)
pnpm install
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> apps/backend/.env.local
pnpm db:migrate             # the local database is never migrated automatically
pnpm dev
```

Frontend `https://localhost:8080`, backend `https://localhost:3000`, API reference at
`https://localhost:3000/swagger` and `https://localhost:3000/scalar`. Both dev servers use
certificates from vite-plugin-mkcert.

Port taken by another project? Start this one with `POSTGRES_PORT=<free port> docker compose up
-d postgres` and put the same port in `DATABASE_URL` in `apps/backend/.env.local`: the integration
tests follow it.

## Commands

```bash
pnpm verify                 # the Definition of Done, see below
pnpm dev                    # backend and frontend dev servers
pnpm lint                   # ESLint + Stylelint (pnpm lint:fix to autofix)
pnpm typecheck              # tsc (backend, tests included) and vue-tsc (frontend)
pnpm test                   # Vitest, backend: unit, and integration on Postgres (docker compose up -d)
pnpm build                  # production builds

pnpm nx run backend:test -- tests/unit/ability.test.ts    # a single test file
pnpm nx run backend:test -- --project unit                # the unit tests only, no database
pnpm nx run frontend:ui-tour                              # screenshots + console errors, docs/agents/ui-tour.md

pnpm db:generate            # a migration from schema changes (needs a real terminal for renames)
pnpm db:migrate             # apply migrations to DATABASE_URL
pnpm db:check               # validate the migration history
pnpm db:studio              # Drizzle Studio
pnpm auth:generate-schema   # what the installed better-auth expects, to diff against Auth.ts
pnpm deps:duplicates        # packages the lockfile resolves twice
```

## Definition of Done

Before reporting work complete, run `pnpm verify` and report its outcome. It runs, in order:
the lockfile duplicate check, ESLint and Stylelint, `typecheck` for both apps, the backend
tests and both production builds. The integration tests need the Postgres of
`docker-compose.yml`: at every run they drop, recreate and migrate `<database>_test` on the
server of `DATABASE_URL` (or the database of `TEST_DATABASE_URL`, whose name must end in
`_test`), and fail with a clear message when it is not reachable.

- Vitest strips types without checking them: a green `test` says nothing about types, which is
  why `typecheck` is part of the same command.
- A change under `packages/` is typechecked by both apps, and they do not see the same code the
  same way (the frontend program also pulls the backend packages in through `import type`).
- A schema change also needs `pnpm db:generate`, a look at the generated SQL and
  `pnpm db:migrate` against the local database.
- A UI change also needs a look at the running app: `pnpm nx run frontend:ui-tour` with the dev
  servers up (docs/agents/ui-tour.md). No test suite covers the frontend.
- Say which checks you ran and which you skipped. Never report a skipped check as passed.

## Repository structure

| Path | What lives there |
| --- | --- |
| `apps/backend` | Fastify API, built by Vite with vite-plugin-node |
| `apps/frontend` | Vue 3 SPA, file-based routing, PWA |
| `packages/ability` | CASL roles, subjects and the ability factory, shared by both apps |
| `packages/auth` | better-auth server configuration (`auth`, `Session`, `User` types) |
| `packages/components` | Shared Vue components, prefixed `Pk` (loader, skeleton, tables, editor) |
| `packages/composable` | Shared composables (Nx project `composables`): dialogs, pagination, settings store |
| `packages/database` | Drizzle schema, migrations, querystring helpers, the database client |
| `packages/email` | Nodemailer transport and Handlebars templates |
| `packages/i18n` | Global vue-i18n instance and the `en` / `it` messages |
| `packages/icons` | Custom SVG icons compiled to an Iconify collection (`icons:build`) |
| `packages/logger` | Console logger that prints in development builds only |
| `packages/models` | Zod schemas and types shared by API and SPA, built from the Drizzle tables |
| `packages/style` | SCSS entry and settings of `@volverjs/style` |
| `packages/tsconfig` | Shared TypeScript configurations |
| `docs/agents/` | Agent handbook: gotchas, checklists |

Every workspace package is consumed as TypeScript source (`"main": "src/index.ts"`): there is
no package build step except `icons`.

## Architecture

### Backend

**Fastify 5** with class controllers from **fastify-decorators** in
`apps/backend/src/controllers/*.controller.ts`, registered automatically under `/api` with the
versioned route each one declares (`/v1/todos`: `/api/v1/todos`; a new file needs a dev server
restart). Import the route decorators from `controllers/index.ts`, not
from `fastify-decorators`: they add the `permissions` option and derive the params schema from
the url.

- `main.ts` is the entry point: it checks the environment and listens in production;
  `app.ts` exports `buildServer()`, which registers everything and never listens, so tests call
  `server.inject()` on it.
- Validation with **fastify-type-provider-zod** and the Zod 4 schemas of `packages/models`.
  Responses are serialized by parsing them with the route schema
  (`utils/responseSerializer.ts`), not with the library's default encoder.
- Services are resolved through a **brandi** container (`container/index.ts`, tokens in
  `container/tokens.ts`): controllers take services from the container, never instantiate
  them.
- Plugins in `src/plugins/`: `fastifyProblemJson` (errors as `application/problem+json`),
  `fastifyPagination` (CORS and `PagedResponse` to `X-Total-Count`), `fastifyDocs` (Swagger
  and Scalar, better-auth routes included), `fastifyBetterAuth` (the `/auth/*` handler and
  `request.user` / `request.session`), `fastifyAbility` (`request.ability`).

### Data

**PostgreSQL** through **Drizzle ORM**: schema in `packages/database/src/schema/`, migrations in
`packages/database/drizzle/`. Entity tables spread `entityDefaultColumns` (uuid id, audit
columns, soft delete); the `snapshot` table keeps a JSON copy of every write. List endpoints
share one querystring shape, built with `zodQs` in `packages/models/src/utils.ts` and turned
into SQL by `packages/database/src/helpers.ts`: `page[number]`, `page[size]`, `sort=-field`,
`filter[field]`, `filter[fullText]`, `ids`.

### Auth and permissions

**better-auth 1.7** (`packages/auth`): email and password, the `admin`, `organization` and
`openAPI` plugins, and Microsoft, Google, GitHub and Facebook sign-in, each enabled only when its
credentials are set. The tables of better-auth and its plugins are written by hand in
`packages/database/src/schema/Auth.ts`.

**CASL** (`packages/ability`): roles `admin` and `user`, capabilities in `src/roles/`. A role is
a function of the user, so a rule can be limited to the user's own rows
(`condition: { createdBy: user.id }`). The backend builds one ability per request
(`request.ability`); the browser keeps a single `ability`, updated from the session, read with
`useAbility()` of `@casl/vue`, which only hides what the API would refuse.

- A route without `permissions` is public; with them, an anonymous request gets a 401 and a
  signed-in role with no rule for the action a 403.
- Conditions are applied by the service, never on the request body: `accessibleBy()` puts them
  in the WHERE of every query and `assertCan()` checks the stored row before a write
  (`apps/backend/src/utils/permissions.ts`). A row the user may not read is a 404, like a
  missing one.

### Frontend

**Vue 3** + **Vite 8**. File-based routing with **vue-router 5** in `src/pages/` (typed routes in
`src/typed-router.d.ts`, route meta through `definePage`: `isPublic`, `hasSidebar`; a
`name@sidebar.vue` file fills the `sidebar` named view). Every `src/modules/*.ts` exporting
`install` runs at boot (router, head, Pinia and the app are passed in).

- Auto-imports: Vue, vue-i18n, VueUse, Pinia, vue-router and the folders listed in
  `vite.config.ts`. Components register themselves: `Vv*` from `@volverjs/ui-vue`, `Pk*` from
  `packages/components`, and the app's own `Pj*` in `src/components/`.
- HTTP through the `@volverjs/data` HttpClient (`modules/httpClient.ts`), which turns a 403 or
  5xx problem+json response into an alert. One store per API resource in `src/stores/`: a
  `RepositoryHttp` wrapped by `defineStoreRepository` of `@volverjs/query-vue`
  (`useTodoStore.ts`). Auth through the better-auth Vue client (`modules/auth.ts`), which also
  holds the navigation guard.
- i18n: global messages in `packages/i18n`, page-specific ones in `<i18n>` blocks. Zod
  validation errors are translated by `@volverjs/zod-vue-i18n` (`modules/i18n.ts`).

## Working conventions

### Frontend code

- Invoke the `volverjs-style` and `volverjs-ui-vue` skills before writing markup or classes: the
  vocabulary looks like Tailwind and is not. `volverjs-form-vue`, `volverjs-data`,
  `volverjs-query-vue` and `volverjs-zod-vue-i18n` cover the rest of the stack.
- Styles are plain BEM in `<style lang="scss">`: lint rejects `scoped` and `module`, so class
  names carry the component's block prefix. Reusable utilities go in
  `packages/style/custom/_index.scss`.
- A `VvButton` takes its text from `:label`, not from the default slot, which replaces what the
  `loading` state renders. Pair `:loading` with `:disabled`.
- Icons by bundled name (`trash`, `edit`, `search`) or from the custom collection of
  `packages/icons`. A name with a collection prefix (`mdi:home`) is downloaded from the public
  Iconify API at runtime: only the social sign-in logos (`logos:*`) do that.
- Every user-facing string goes through i18n, in **both** `en` and `it`: lint refuses a key
  missing from one locale (`packages/i18n/src/*.json` and the `<i18n>` blocks alike) and warns
  on a `$t` key that exists in none.

### Environment variables

- Backend: `apps/backend/.env` is committed and holds no secret, only defaults and empty
  placeholders; `apps/backend/.env.local` (git ignored) fills in the secrets and is loaded over
  it. A variable set in the shell wins over both. Minimum for development: `DATABASE_URL` and
  `BETTER_AUTH_SECRET`. The integration tests derive their database from `DATABASE_URL`
  (`<database>_test`, same server); `TEST_DATABASE_URL` overrides it.
- Frontend: `.env`, `.env.development`, `.env.staging`, `.env.production` are committed and hold
  public `VITE_*` settings only. `VITE_BACKEND_URL` must be set for every mode that is built;
  the build warns when it is empty.
- A new variable is declared in `apps/backend/src/environment.d.ts` or
  `apps/frontend/src/vite-env.d.ts` and documented in the committed `.env` file.

### Pinned versions

- `typescript` is exactly 6.0.3 and rejected in [.ncurc.yml](.ncurc.yml): TypeScript 7 still
  breaks typescript-eslint and vue-tsc (docs/agents/gotchas/dependencies.md).
- `better-auth` is pinned exactly, in the root and in `apps/backend`. After moving it, run
  `pnpm auth:generate-schema` and bring `Auth.ts` in line before anything else. If a
  `@better-auth/*` package is ever added, pin the whole line to the same version in an
  `overrides` block, or two `@better-auth/core` copies break every inferred type.
- The `@volverjs/*` packages are pinned exactly in the root `package.json`, and
  `@volverjs/style` in `packages/style`.
- `docker-compose.yml` pins the Postgres major: a new major cannot read the old data directory.

Upgrading: `pnpm dlx npm-check-updates` lists what moved, then `pnpm install`,
`pnpm deps:duplicates` and `pnpm verify`. pnpm refuses versions published less than a day ago:
do not add `minimumReleaseAgeExclude` entries to get around it.

### Writing and commits

- Everything that lands in the repository is English: code comments, docs, commit messages, PR
  titles and bodies.
- No em or en dashes in prose, commit messages or PR text (the guard hook refuses them in
  Markdown and in `git commit` / `gh pr` commands): use a colon, parentheses, a comma or a new
  sentence.
- No agent signature on commits and PRs: no `Co-Authored-By` trailer, no "Generated with" line.
- Commit only when asked, in coherent commits, and stage selectively so unrelated work in the
  tree stays out. Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`...).
