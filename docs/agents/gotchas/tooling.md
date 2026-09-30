# Tooling gotchas

Part of the [gotchas index](../gotchas.md): tests, typecheck, env loading, dev servers. Each
entry: what breaks, why, what to do.

## Vitest does not typecheck

Vitest transforms TypeScript without checking it, so a green `backend:test` can sit on top of
type errors, in the code and in the tests themselves.

**Do:** close backend work with `pnpm verify`, or at least `pnpm nx run backend:typecheck`
next to the tests. `apps/backend/tsconfig.json` includes `tests/**` for this reason.

## The shell wins over `.env.local`, which wins over `.env`

The backend loads its env with `loadEnv(mode, cwd, '')` (every variable, not only `VITE_`),
and Vite gives a variable already set in the process priority over the files; drizzle-kit
reads the same files in the same order (`packages/database/drizzle.config.ts`). Measured on
2026-09-29, and relied upon to run the whole stack against a throwaway database while the
developer's `.env.local` pointed at a shared one.

**Do:** to point a run somewhere else, set the variable in the shell
(`DATABASE_URL=postgres://... pnpm nx run backend:dev`) instead of editing `.env.local`. Mind
the other secrets `.env.local` still loads: blank the SMTP settings the same way when the run
must not send mail.

## `pnpm dev` of the frontend reloads once on a fresh install

After a lockfile change the first request makes Vite optimize dependencies and reload the page
("optimized dependencies changed. reloading"). A script that fills a form right after the first
navigation finds nothing.

**Do:** wait for the element, not for a fixed time, as `apps/frontend/scripts/ui-tour.mjs` does
for the sign-in form.
