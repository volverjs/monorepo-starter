# Database gotchas

Part of the [gotchas index](../gotchas.md): Drizzle, migrations, the local Postgres. Each entry:
what breaks, why, what to do.

## `pnpm db:generate` can fail and still report success

drizzle-kit asks interactively when it cannot tell a rename from a drop and a create (it did on
2026-09-29 for the `Id` to `id` columns of `member`, `organization` and `verification`). Without
a TTY, which is every agent shell, it prints
`Error: Interactive prompts require a TTY terminal` and exits with code 0: Nx then prints
"Successfully ran target generate" and no migration exists.

**Do:** after `pnpm db:generate`, check `git status packages/database/drizzle` before trusting
the message. When it prompts, run it in a real terminal, or answer the prompt with `expect`
(the default choice is "create column", which drops the data of a renamed one: pick the
rename). Read the generated SQL before `pnpm db:migrate`.

## better-auth reports a missing column only at startup

better-auth checks the Drizzle schema against what the installed version expects, and a gap is
not a type error: it logs `ERROR [Better Auth]: Drizzle schema mismatch  Missing columns
invitation.createdAt` at runtime. Moving from 1.4 to 1.7 on 2026-09-29 needed that column plus
indexes and defaults, all found by comparing against the generated schema; migration
`0001_better_auth_1_7.sql` carries them.

**Do:** after every better-auth upgrade run `pnpm auth:generate-schema`, diff
`packages/database/src/schema/Auth.generated.ts` (git ignored) against `Auth.ts`, port the
differences by hand and generate a migration. Keep deliberate differences, such as
`session.active_organization_id` typed `uuid` like every other id here.

## The local Postgres port is shared with other projects

On the development machine 5432 was already taken by another project's container, with the
same default password. This template used to point at that server's default `postgres`
database, so `pnpm db:migrate` would have created this project's tables inside another
project's instance, and `docker compose up` failed to bind the port.

**Do:** the database is named after the project (`POSTGRES_DB` in `docker-compose.yml`, the
same name in `DATABASE_URL`) and the port is configurable: `POSTGRES_PORT=5433 docker compose
up -d postgres`, with the same port in `DATABASE_URL`. Before migrating or testing, check which
server `DATABASE_URL` points at (`apps/backend/.env.local` wins over `.env`, and the shell wins
over both): the integration tests create and drop `<database>_test` on that same server.

`POSTGRES_DB` only names the database the first time the volume is created. A volume made
before the rename (the template used `postgres` until 2026-09-29) or before a later change of
`POSTGRES_DB` does not have the new database, and `pnpm db:migrate` fails with
`database "<name>" does not exist`: create it
(`docker compose exec postgres createdb -U postgres <name>`) and migrate, or keep the old name
in `DATABASE_URL` in `.env.local`.

## `drizzle.config.ts` runs as CommonJS

drizzle-kit transpiles its config to CommonJS before loading it, so `import.meta.dirname` is
`undefined` there. The config used it to find `apps/backend/.env`, inside a `try` that also
swallowed the resulting `TypeError`: on 2026-09-29 the env files were never read, which went
unnoticed while `DATABASE_URL` came from the shell, and the first scaffolded project failed
with `DATABASE_URL is not set`.

**Do:** resolve paths in `packages/database/drizzle.config.ts` from the working directory (Nx
runs every target of the project in `packages/database`), and catch only the error you expect
(`ENOENT` for a missing env file).
