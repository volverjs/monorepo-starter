---
name: volverjs-monorepo-starter
description: >
  Scaffold a new full-stack project from the @volverjs/monorepo-starter template: an Nx + pnpm
  monorepo with a Vue 3 SPA on the Volver design system (@volverjs/ui-vue, @volverjs/style), a
  Fastify API, PostgreSQL through Drizzle ORM, better-auth sign-in, CASL permissions, i18n and an
  AI-first setup (AGENTS.md, CLAUDE.md, guard hooks, pinned skills). A bundled script copies the
  template, renames the project, sets the app name, locale, social sign-in, database and ports,
  generates the auth secret, installs, squashes the migrations and runs the full verification.
  Use whenever the user wants to create, start, bootstrap or scaffold a new project, app, web
  app, portal, backoffice or monorepo with Volver or volverjs, or says "nuovo progetto",
  "crea un progetto", "parti dal monorepo-starter", "usa il template volverjs". Not for
  adding features to a project that already exists (follow that project's AGENTS.md), and not
  for projects on another stack (Nuxt, React, NestJS).
---

# Scaffold a project from @volverjs/monorepo-starter

The template is <https://github.com/volverjs/monorepo-starter>. What a new project contains, and
how to work in it, is in the AGENTS.md the project inherits: read it after scaffolding, not
before. This skill only creates the project and proves it works.

`scripts/scaffold.mjs` (next to this file) does every deterministic step. Your job is to gather
the inputs, run it, handle what it reports and bring the project up.

## 1. Check the machine

```bash
node --version   # 24.12 or newer, or 22.20 or newer
pnpm --version   # any: the template's packageManager version is fetched automatically
git --version
docker info --format '{{.ServerVersion}}'   # the local database and the integration tests
```

Missing Node or pnpm: stop and say what to install. Missing Docker: scaffolding still works,
but the local database does not, and the verification skips the integration tests (the script
says so: report it, do not call the project verified).

Check the local Postgres port before choosing one: another project's container often sits on
5432 (`docker ps --format '{{.Names}} {{.Ports}}'`, `lsof -iTCP:5432 -sTCP:LISTEN`). If it is
taken, pick a free port (5433, 5434...) and pass it as `--postgres-port`. The script starts
Postgres only: PgAdmin (5050) and the dev servers (3000, 8080) may be busy too, step 4 says what
to do then.

## 2. Gather the inputs

Ask only for what has no sensible default, in **one** message, and propose the defaults:

| Input | Option | Default |
| --- | --- | --- |
| Where to create it | `--dir` | required: ask |
| Display name | `--title` | from the directory name (`acme-portal` becomes "Acme Portal") |
| One-sentence description | `--description` | the title: ask, it lands in README, AGENTS.md and the PWA |
| Short name (header, sidebar) | `--short-name` | the title |
| Line under the name in the sidebar | `--tagline` | none |
| Package and database name | `--name` | the directory name |
| npm scope of the root package | `--scope` | none |
| Default UI locale | `--locale` | `en` (the template ships `en` and `it`) |
| Social sign-in buttons | `--social` | `none`; any of `microsoft,google,github,facebook` |
| API URL of the staging and production builds | `--staging-api-url`, `--production-api-url` | empty (the build warns) |
| Local Postgres host port | `--postgres-port` | 5432, or a free one from step 1 |
| License | `--license` | `UNLICENSED` (LICENSE removed); `MIT` needs `--author` |

Then state the full plan (directory, names, options) and wait for the user to confirm: the
script creates files outside the current project and runs `pnpm install`.

## 3. Run the script

```bash
node <this skill's directory>/scripts/scaffold.mjs \
  --dir ../acme-portal --title "Acme Portal" --description "Self-service portal for Acme customers." \
  --locale it --social microsoft --postgres-port 5433
```

- The template comes from GitHub (`main`). Inside a checkout of the template, or to scaffold
  from a branch, pass `--from <path>` or `--from <git url> --ref <branch>`.
- `node scaffold.mjs --help` lists every option.
- It takes a few minutes: it installs the dependencies, replaces the migration history with one
  `0000_init.sql`, starts the project's Postgres with `docker compose` (the integration tests
  need it) and runs `pnpm verify` (lint, typecheck, tests, production builds) inside the new
  project. Do not skip the verification unless the user asks.

When it stops with **`template changed: ...`**, the template moved and the script no longer
matches it. Do not finish the renaming by hand: the half-made project is not trustworthy.
Report the message, delete the target directory, and point to the fix, which belongs in the
template repository (`skills/volverjs-monorepo-starter/scripts/scaffold.mjs`, where
`pnpm scaffold:check` reproduces the failure).

Any other failure (install, verify): read the output, fix the cause if it is local (network,
Node version, a port), and rerun into an empty directory.

## 4. Bring it up (when Docker is available)

In the new project, with `NX_WORKSPACE_ROOT_PATH` unset: an editor or an agent session opened
in another Nx workspace exports it, and Nx prefers it to the working directory, so every command
below would run on that workspace instead (the script already drops it for its own steps).

```bash
unset NX_WORKSPACE_ROOT_PATH
docker compose up -d postgres   # already running if the script found Docker
pnpm db:migrate
pnpm dev                        # frontend https://localhost:8080, backend https://localhost:3000
```

With 3000 or 8080 taken, run the two servers on other ports from the shell:
`PORT=13000 BETTER_AUTH_URL=https://localhost:13000 FRONTEND_URL=https://localhost:18080 pnpm nx run backend:dev`
and `VITE_BACKEND_URL=https://localhost:13000 pnpm nx run frontend:dev -- --port 18080`, then
`UI_TOUR_BASE_URL=https://localhost:18080` for the tour and those URLs below. PgAdmin is
`docker compose up -d pgadmin`, with `PGADMIN_PORT` when 5050 is taken.

Then prove the app works instead of assuming it: sign up a user through the API, create a todo
with the session, and run the UI tour, which signs in through the real form and fails on any
console error.

```bash
curl -sk -c .cookies.local -H 'Origin: https://localhost:8080' -H 'Content-Type: application/json' \
  -d '{"name":"First User","email":"first@example.com","password":"change-me-please"}' \
  https://localhost:3000/auth/sign-up/email
curl -sk -b .cookies.local -H 'Origin: https://localhost:8080' -H 'Content-Type: application/json' \
  -d '{"title":"First todo"}' https://localhost:3000/api/v1/todos
UI_TOUR_EMAIL=first@example.com UI_TOUR_PASSWORD=change-me-please \
  pnpm nx run frontend:ui-tour -- /frontoffice/dashboard /frontoffice/todos /frontoffice/todos/<id>
rm .cookies.local
```

Look at one or two screenshots in `apps/frontend/.ui-tour/`: the new name must be in the sidebar
and the page title (the header shows it on narrow screens only). The backoffice needs an
`admin`, and sends anyone else to the frontoffice: tell the user how to promote their account
(`update "user" set role = 'admin' where email = '...'`) rather than doing it on their behalf.

Stop the dev servers when you are done, unless the user wants them running.

## 5. Hand over

- Offer to install the project's pinned skills (`npx skills experimental_install`, run in the
  new project) and to make the initial commit. Do neither unasked. An initial commit, when
  wanted, is `chore: scaffold from @volverjs/monorepo-starter`, with no agent signature.
- Creating a remote repository (`gh repo create`) publishes code: only on explicit request.
- Report what was created and what was verified (the script's summary lists both), and the
  first customizations from [references/after-scaffold.md](references/after-scaffold.md): logo
  and icons, brand color, social sign-in credentials and callback URLs, SMTP, deploy settings,
  and when to remove the Todo sample.
