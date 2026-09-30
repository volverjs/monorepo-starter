# Volver Monorepo Starter Skill

Agent skill that scaffolds a new project from
[@volverjs/monorepo-starter](https://github.com/volverjs/monorepo-starter): an Nx + pnpm monorepo
with a Vue 3 SPA on the Volver design system, a Fastify API, PostgreSQL through Drizzle ORM,
better-auth and an AI-first setup (AGENTS.md, CLAUDE.md, guard hooks, pinned skills).

## Installation

```bash
npx skills add volverjs/monorepo-starter -g
```

In Claude Code it is also available as the `volverjs-monorepo-starter` plugin
([.claude-plugin/plugin.json](../../.claude-plugin/plugin.json)).

## What it does

1. Checks the machine (Node, pnpm, git, Docker) and finds a free port for the local Postgres.
2. Asks for the project directory, name and description, and proposes defaults for the rest.
3. Runs [scripts/scaffold.mjs](scripts/scaffold.mjs), which copies the template, renames the
   project, sets the app name, locale, social sign-in buttons, API URLs and database, generates
   the auth secret, removes what only the template needs, installs, replaces the migration
   history with one initial migration and runs `pnpm verify` in the new project.
4. Brings the app up, signs a user in through the real form and checks every page for console
   errors with the project's UI tour.
5. Hands over the first customizations: logo, brand color, sign-in credentials, SMTP, deploy.

The script can also be used without an agent:

```bash
node scripts/scaffold.mjs --help
node scripts/scaffold.mjs --dir ../acme-portal --title "Acme Portal" --description "..."
```

## Layout

```text
volverjs-monorepo-starter/
├── SKILL.md                  workflow
├── scripts/scaffold.mjs      the deterministic steps, no dependency
└── references/
    └── after-scaffold.md     brand, sign-in, email, deploy, removing the sample
```

## Keeping it in sync

The skill lives in the template repository on purpose: a template change and the matching
script change land together. `pnpm scaffold:check`, part of the template's `pnpm verify`,
scaffolds a throwaway copy of the working tree and fails when an edit of the script no longer
applies.

## License

MIT
