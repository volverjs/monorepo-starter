<div align="center">

[![volverjs](packages/icons/src/logo.svg)](https://volverjs.github.io/style)

## @volverjs/monorepo-starter

`vue` `volverjs` `vite` `nx` `pnpm` `fastify` `drizzle` `postgres` `better-auth` `pwa` `ai-first`

<br>

maintained with ❤️ by

<br>

[![Eight Wave](packages/icons/src/8wave.svg)](https://8wave.it)

<br>

</div>

A full-stack web app template: a Vue 3 SPA on the Volver design system, a Fastify API, PostgreSQL
through Drizzle ORM and authentication with better-auth, in an Nx + pnpm monorepo that coding
agents can work in from the first commit.

## Features

- ⚡️ [Vue 3](https://vuejs.org/), [Vite 8](https://vite.dev/), [pnpm](https://pnpm.io/) and [Nx](https://nx.dev/) with task caching
- 😺 [Fastify 5](https://fastify.dev/) with decorator controllers, Zod validation, problem+json errors and OpenAPI docs (Swagger and Scalar)
- 💾 [Drizzle ORM](https://orm.drizzle.team/) on PostgreSQL, with pagination, sorting, filters and full-text search on every list
- 🔑 [Better Auth](https://www.better-auth.com/): email and password, Microsoft, Google, GitHub and Facebook sign-in, admin and organizations
- 🛡️ [CASL](https://casl.js.org/) roles and permissions shared by API and SPA
- 🗂 File-based routing with typed routes ([vue-router 5](https://router.vuejs.org/))
- 🎨 [@volverjs/ui-vue](https://github.com/volverjs/ui-vue) and [@volverjs/style](https://github.com/volverjs/style), light and dark theme
- 🌍 [Vue I18n](https://vue-i18n.intlify.dev/) in English and Italian, Zod errors included
- 📲 [PWA](https://vite-pwa-org.netlify.app/)
- 🧪 [Vitest](https://vitest.dev/) and a one-command Definition of Done: `pnpm verify`
- 🤖 AI first: `AGENTS.md`, guard hooks, pinned skills and a UI tour for coding agents (below)
- 🦾 TypeScript everywhere

### Volver

- [@volverjs/style](https://volverjs.github.io/style/): the easy way to style
- [@volverjs/ui-vue](https://github.com/volverjs/ui-vue): the lightweight Vue 3 component library
- [@volverjs/form-vue](https://github.com/volverjs/form-vue): forms from Zod schemas
- [@volverjs/zod-vue-i18n](https://github.com/volverjs/zod-vue-i18n): Zod validation messages with Vue I18n
- [@volverjs/query-vue](https://github.com/volverjs/query-vue): query state management
- [@volverjs/data](https://github.com/volverjs/data): tiny HttpClient and repositories on the Fetch API

## Create a project

### With a coding agent

Install the scaffolding skill once, then ask your agent for a new project ("create a new
project from the volverjs monorepo starter"):

```bash
npx skills add volverjs/monorepo-starter -g
```

In Claude Code the skill is also available as the `volverjs-monorepo-starter` plugin. It asks
for the name and a description, checks for a free database port, scaffolds, installs, runs the
whole verification and brings the app up.

### With the script

The skill's script works on its own too (Node.js 24.12, or 22.20, or newer):

```bash
git clone --depth 1 https://github.com/volverjs/monorepo-starter.git
node monorepo-starter/skills/volverjs-monorepo-starter/scripts/scaffold.mjs \
  --dir my-app --title "My App" --description "What my app does."
```

`--help` lists every option: locale, social sign-in buttons, npm scope, API URLs, database
port, license.

### By hand

[Create a repository from this template on GitHub](https://github.com/volverjs/monorepo-starter/generate),
or `npx degit volverjs/monorepo-starter my-app`, then rename it yourself: the `VITE_APP_*`
settings in `apps/frontend/.env`, the database name in `apps/backend/.env` and
`docker-compose.yml`, the root `package.json`, `LICENSE`, this README.

## Getting started

Requirements: [Node.js](https://nodejs.org/) 24.12 or newer (22.20 or newer on the 22 line), [pnpm](https://pnpm.io/),
[Docker](https://www.docker.com/).

```bash
docker compose up -d
pnpm install
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> apps/backend/.env.local
pnpm db:migrate
pnpm dev
```

- Frontend: [https://localhost:8080](https://localhost:8080)
- Backend: [https://localhost:3000](https://localhost:3000), API reference at [/swagger](https://localhost:3000/swagger) and [/scalar](https://localhost:3000/scalar)
- PgAdmin: [http://localhost:5050](http://localhost:5050) (`pgadmin4@dpage.com`, `Volverjs!`), server `postgres`, user `postgres`, password `Volverjs!`

Another Postgres already on 5432? `POSTGRES_PORT=5433 docker compose up -d`, and the same port in
`DATABASE_URL` in `apps/backend/.env.local`.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Backend and frontend dev servers |
| `pnpm verify` | Lint, typecheck, tests, production builds and the template checks |
| `pnpm lint` / `pnpm lint:fix` | ESLint and Stylelint |
| `pnpm typecheck` | `tsc` for the backend, `vue-tsc` for the frontend |
| `pnpm test` | Backend tests (Vitest) |
| `pnpm build` | Production builds |
| `pnpm db:generate` / `pnpm db:migrate` | Drizzle migrations |
| `pnpm nx run frontend:ui-tour` | Screenshots of the running app in both themes, failing on console errors |

## AI first

The repository is set up so a coding agent can work in it safely from the start:

- [AGENTS.md](AGENTS.md): conventions, architecture, commands and the Definition of Done, read
  by every agent; [CLAUDE.md](CLAUDE.md) adds what is specific to Claude Code.
- [docs/agents/](docs/agents/): traps that already cost debugging time, and checklists (adding an
  API resource, looking at a UI change).
- [.claude/settings.json](.claude/settings.json) and [a guard hook](.claude/hooks/guard.mjs) that
  refuses bypassing Nx, dashes in prose and agent signatures on commits, with tests.
- [skills-lock.json](skills-lock.json): the third-party skills the project relies on (Vue,
  Pinia, Vite, Vitest, pnpm, Fastify, Node, TypeScript), installed with
  `npx skills experimental_install`; the Volver skills come with the Volver plugins.
- [.mcp.json](.mcp.json): the Nx MCP server.
- Rules enforced by tools rather than prose: lint refuses scoped styles and missing
  translations, a script refuses duplicated core packages in the lockfile, and
  `pnpm scaffold:check` keeps the scaffolding skill in step with the template.

## Coding style

- Composition API with `<script setup>`, plain BEM styles in `<style lang="scss">`
- [ESLint](https://eslint.org/) with the TypeScript, Vue and Vue I18n recommended rules
- [Stylelint](https://stylelint.io/) with the standard SCSS rules
- [Prettier](https://prettier.io/): single quotes, no semicolons, trailing commas, four spaces

## Acknowledgements

This repository is inspired by 🏕 [antfu/vitesse](https://github.com/antfu/vitesse).

## License

[MIT](LICENSE)
