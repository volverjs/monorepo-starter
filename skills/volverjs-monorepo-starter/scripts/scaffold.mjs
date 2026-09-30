#!/usr/bin/env node
// Scaffolds a new project from @volverjs/monorepo-starter: the deterministic half of the
// volverjs-monorepo-starter skill (the workflow around it is in ../SKILL.md).
//
//   node scaffold.mjs --dir ../acme-portal --title "Acme Portal" --description "..." [options]
//   node scaffold.mjs --check          scaffold a throwaway copy of the template, then delete it
//
// Every edit asserts that the text it changes is still in the template. When the template
// moves on, the script stops and names the edit that no longer applies, instead of producing
// a project that is renamed halfway. No dependency: Node.js 24.12, or 22.20, or newer.
import { execFileSync, spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'

const DEFAULT_SOURCE = 'https://github.com/volverjs/monorepo-starter.git'
const DEFAULT_REF = 'main'
const SOCIAL_PROVIDERS = ['microsoft', 'google', 'github', 'facebook']
const TEMPLATE_ROOT = path.resolve(import.meta.dirname, '../../..')
// Only the template publishes the scaffolding skill and carries the maintainer's logo.
const TEMPLATE_ONLY = ['skills', '.claude-plugin', 'packages/icons/src/8wave.svg']
// The verify script of the template once scaffold:check is removed: without
// Docker the script runs it step by step, and fails when the template's differs.
const VERIFY_STEPS = [
    'pnpm deps:duplicates',
    'node --test .claude/hooks/guard.test.mjs',
    'pnpm lint',
    'nx run-many --targets=typecheck,test,build',
]

// Never copied from a local working tree, whatever .gitignore says.
const NEVER_COPY = /(^|\/)(node_modules|\.git|\.nx|dist|\.ui-tour|\.agents)(\/|$)|(^|\/)\.claude\/(skills|settings\.local\.json)|\.local$/

const HELP = `Scaffold a new project from @volverjs/monorepo-starter.

Required:
  --dir <path>              target directory (must not exist, or be empty)

Project:
  --name <slug>             package and database name (default: the directory name)
  --title <text>            display name, page title, PWA name (default: from the slug)
  --short-name <text>       name in the header, sidebar and PWA short name (default: title)
  --tagline <text>          second line under the name in the sidebar (default: none)
  --description <text>      one sentence, used in README, AGENTS.md, PWA (default: title)
  --scope <@scope>          npm scope of the root package name, e.g. @acme
  --locale <en|it>          default UI locale (default: en)
  --social <list|none>      sign-in buttons: ${SOCIAL_PROVIDERS.join(', ')} (default: none)
  --staging-api-url <url>   VITE_BACKEND_URL of the staging build
  --production-api-url <url> VITE_BACKEND_URL of the production build
  --postgres-port <port>    host port of the local Postgres (default: 5432)
  --license <UNLICENSED|MIT> (default: UNLICENSED, which removes LICENSE)
  --author <name>           LICENSE holder with --license MIT (default: git user.name)

Source:
  --from <path|git url>     template to copy (default: ${DEFAULT_SOURCE})
  --ref <branch|tag>        with a git url (default: ${DEFAULT_REF})

Steps:
  --skip-install            do not run pnpm install (implies --keep-migrations, --skip-verify)
  --keep-migrations         keep the template's migration history instead of one initial migration
  --skip-verify             do not run pnpm verify
  --no-git                  do not git init
  --check                   scaffold the local template into a temp dir, check, delete it
  --json                    print the summary as JSON
`

function fail(message) {
    console.error(`scaffold: ${message}`)
    process.exit(1)
}

const { values: args } = parseArgs({
    options: {
        dir: { type: 'string' },
        name: { type: 'string' },
        title: { type: 'string' },
        'short-name': { type: 'string' },
        tagline: { type: 'string', default: '' },
        description: { type: 'string' },
        scope: { type: 'string' },
        locale: { type: 'string', default: 'en' },
        social: { type: 'string', default: 'none' },
        'staging-api-url': { type: 'string', default: '' },
        'production-api-url': { type: 'string', default: '' },
        'postgres-port': { type: 'string', default: '5432' },
        license: { type: 'string', default: 'UNLICENSED' },
        author: { type: 'string' },
        from: { type: 'string' },
        ref: { type: 'string', default: DEFAULT_REF },
        'skip-install': { type: 'boolean', default: false },
        'keep-migrations': { type: 'boolean', default: false },
        'skip-verify': { type: 'boolean', default: false },
        'no-git': { type: 'boolean', default: false },
        check: { type: 'boolean', default: false },
        json: { type: 'boolean', default: false },
        help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
})

if (args.help) {
    console.log(HELP)
    process.exit(0)
}

// The generated project needs what its dependencies declare (vite-plugin-mkcert and undici
// on the 22 line, a native binary of the 24 line): stop here rather than halfway through
// the install.
const [nodeMajor, nodeMinor] = process.versions.node.split('.').map(Number)
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 20) || (nodeMajor === 24 && nodeMinor < 12)) {
    fail(`Node.js ${process.versions.node} is too old: use 24.12 or newer (or 22.20 or newer)`)
}

if (args.check) {
    args.dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scaffold-check-'))
    args.from ??= TEMPLATE_ROOT
    args.name ??= 'scaffold-check'
    args.title ??= 'Scaffold Check'
    args['skip-install'] = true
    args['no-git'] = true
    // Whatever the outcome: fail() exits without reaching the end of the script.
    const checkDir = args.dir
    process.on('exit', () => fs.rmSync(checkDir, { recursive: true, force: true }))
}

// ---------------------------------------------------------------- inputs

if (!args.dir) {
    fail('--dir is required (see --help)')
}
const target = path.resolve(args.dir)
const slug = args.name ?? path.basename(target)
if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(slug)) {
    fail(`"${slug}" is not a valid name: lowercase letters, digits and dashes, starting with a letter`)
}
if (args.scope && !/^@[a-z0-9][a-z0-9-._]*$/.test(args.scope)) {
    fail(`--scope must look like @acme, got "${args.scope}"`)
}
if (!['en', 'it'].includes(args.locale)) {
    fail(`--locale must be en or it, got "${args.locale}"`)
}
const social =
    args.social === 'none' ? [] : args.social.split(',').map((provider) => provider.trim()).filter(Boolean)
const unknownProviders = social.filter((provider) => !SOCIAL_PROVIDERS.includes(provider))
if (unknownProviders.length) {
    fail(`unknown --social provider(s): ${unknownProviders.join(', ')}`)
}
const postgresPort = Number(args['postgres-port'])
if (!Number.isInteger(postgresPort) || postgresPort < 1 || postgresPort > 65535) {
    fail(`--postgres-port must be a port number, got "${args['postgres-port']}"`)
}
if (!['UNLICENSED', 'MIT'].includes(args.license)) {
    fail(`--license must be UNLICENSED or MIT, got "${args.license}"`)
}
for (const option of ['staging-api-url', 'production-api-url']) {
    if (args[option] && !/^https?:\/\/[^\s/]+/.test(args[option])) {
        fail(`--${option} must be an http(s) URL, got "${args[option]}"`)
    }
}
if (args['skip-install']) {
    args['keep-migrations'] = true
    args['skip-verify'] = true
}

const title =
    args.title ?? slug.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
const shortName = args['short-name'] ?? title
const description = args.description ?? title
// Refuse a value the .env files cannot hold now, before anything is copied
for (const value of [title, shortName, args.tagline, description]) {
    dotenvValue(value)
}
const packageName = args.scope ? `${args.scope}/${slug}` : slug
const database = slug.replace(/-/g, '_')
// Postgres cuts identifiers at 63 bytes, and the integration tests add `_test`
if (database.length > 58) {
    fail(`"${slug}" is too long for a database name: 58 characters at most`)
}
const source = args.from ?? DEFAULT_SOURCE
const today = new Date().toISOString().slice(0, 10)

if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    fail(`${target} exists and is not empty`)
}

const isLocalSource = fs.existsSync(source)
if (isLocalSource) {
    const from = path.resolve(source)
    if (target === from || target.startsWith(from + path.sep)) {
        fail('the target directory cannot be inside the template')
    }
}

// ---------------------------------------------------------------- helpers

const report = { target, packageName, title, database, steps: [] }
const step = (message) => {
    report.steps.push(message)
    if (!args.json) {
        console.log(`- ${message}`)
    }
}
const file = (relative) => path.join(target, relative)
const read = (relative) => fs.readFileSync(file(relative), 'utf8')
const write = (relative, content) => {
    fs.mkdirSync(path.dirname(file(relative)), { recursive: true })
    fs.writeFileSync(file(relative), content)
}

/** Replace `from` with `to` in a file, failing when `from` is not there. */
function replaceIn(relative, from, to) {
    const content = read(relative)
    if (!content.includes(from)) {
        fail(`template changed: "${from.split('\n')[0]}" not found in ${relative}. Update scripts/scaffold.mjs.`)
    }
    write(relative, content.split(from).join(to))
}

/** A dotenv value: quoted when a bare one would be cut at `#` or trimmed. */
function dotenvValue(value) {
    if (/[\r\n$]/.test(value)) {
        // Vite expands `$NAME` in .env values, and a value cannot span lines
        fail(`cannot write ${JSON.stringify(value)} to a .env file: no "$" and no line breaks`)
    }
    if (!/[#'"`\\]|^\s|\s$/.test(value)) {
        return value
    }
    if (!value.includes("'")) {
        return `'${value}'`
    }
    if (!/["\\]/.test(value)) {
        return `"${value}"`
    }
    fail(`cannot write ${JSON.stringify(value)} to a .env file: drop the quotes or the backslash`)
}

/** Set KEY=value in a dotenv file, failing when the key is not declared there. */
function setEnv(relative, key, value) {
    const content = read(relative)
    const line = new RegExp(`^${key}=.*$`, 'm')
    if (!line.test(content)) {
        fail(`template changed: ${key} is not declared in ${relative}. Update scripts/scaffold.mjs.`)
    }
    // A function replacer: a `$&` or `$$` in the value is text, not a pattern.
    write(relative, content.replace(line, () => `${key}=${dotenvValue(value)}`))
}

/** Remove the blocks between <!-- starter-only --> markers. */
function stripStarterOnly(relative) {
    const content = read(relative)
    if (!content.includes('<!-- starter-only -->')) {
        fail(`template changed: no starter-only block in ${relative}. Update scripts/scaffold.mjs.`)
    }
    write(relative, content.replace(/<!-- starter-only -->\n[\s\S]*?<!-- \/starter-only -->\n/g, ''))
}

function editJson(relative, edit) {
    const data = JSON.parse(read(relative))
    edit(data)
    write(relative, JSON.stringify(data, null, 4) + '\n')
}

function run(command, commandArgs, options = {}) {
    // A session opened in the template (an editor, an agent) may export
    // NX_WORKSPACE_ROOT_PATH, which Nx prefers to the working directory: every
    // Nx task of the new project would run on the template. No daemon either,
    // it would outlive the script.
    const env = { ...process.env, NX_DAEMON: 'false', ...options.env }
    delete env.NX_WORKSPACE_ROOT_PATH
    const result = spawnSync(command, commandArgs, {
        cwd: target,
        stdio: args.json ? 'pipe' : 'inherit',
        env,
    })
    if (result.status !== 0) {
        fail(`\`${command} ${commandArgs.join(' ')}\` failed in ${target}`)
    }
}

// ---------------------------------------------------------------- 1. copy the template

fs.mkdirSync(target, { recursive: true })
if (isLocalSource) {
    const from = path.resolve(source)
    let files
    try {
        // Tracked and untracked files git would commit: exactly what a clone would hold,
        // plus the work in progress of a template checkout.
        files = execFileSync('git', ['-C', from, 'ls-files', '-z', '--cached', '--others', '--exclude-standard'])
            .toString()
            .split('\0')
            .filter(Boolean)
    } catch {
        files = fs.readdirSync(from, { recursive: true }).filter((entry) =>
            fs.statSync(path.join(from, entry)).isFile(),
        )
    }
    let copied = 0
    for (const relative of files) {
        const absolute = path.join(from, relative)
        if (NEVER_COPY.test(relative) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
            continue
        }
        fs.mkdirSync(path.dirname(file(relative)), { recursive: true })
        fs.copyFileSync(absolute, file(relative))
        copied++
    }
    step(`copied ${copied} files from ${from}`)
} else {
    const clone = spawnSync('git', ['clone', '--depth', '1', '--branch', args.ref, source, target], {
        stdio: args.json ? 'pipe' : 'inherit',
    })
    if (clone.status !== 0) {
        fail(`git clone of ${source} (${args.ref}) failed`)
    }
    fs.rmSync(file('.git'), { recursive: true, force: true })
    step(`cloned ${source} at ${args.ref}, history removed`)
}

for (const relative of TEMPLATE_ONLY) {
    fs.rmSync(file(relative), { recursive: true, force: true })
}
step(`removed the template-only files: ${TEMPLATE_ONLY.join(', ')}`)

// ---------------------------------------------------------------- 2. names and settings

editJson('package.json', (pkg) => {
    if (pkg.name !== '@volverjs/monorepo-starter') {
        fail(`template changed: the root package is "${pkg.name}". Update scripts/scaffold.mjs.`)
    }
    pkg.name = packageName
    pkg.description = description
    pkg.version = '0.0.0'
    pkg.license = args.license
    if (!pkg.scripts['scaffold:check'] || !pkg.scripts.verify.includes(' && pnpm scaffold:check')) {
        fail('template changed: scaffold:check is not wired into verify. Update scripts/scaffold.mjs.')
    }
    delete pkg.scripts['scaffold:check']
    pkg.scripts.verify = pkg.scripts.verify.replace(' && pnpm scaffold:check', '')
    // Without Docker the script runs these steps one by one (section 5)
    if (pkg.scripts.verify !== VERIFY_STEPS.join(' && ')) {
        fail('template changed: the verify script is not the one scripts/scaffold.mjs runs without Docker. Update VERIFY_STEPS.')
    }
})
step(`root package renamed to ${packageName}`)

setEnv('apps/frontend/.env', 'VITE_APP_NAME', title)
setEnv('apps/frontend/.env', 'VITE_APP_SHORT_NAME', shortName)
setEnv('apps/frontend/.env', 'VITE_APP_TAGLINE', args.tagline)
setEnv('apps/frontend/.env', 'VITE_APP_DESCRIPTION', description)
setEnv('apps/frontend/.env', 'VITE_I18N_DEFAULT_LOCALE', args.locale)
setEnv('apps/frontend/.env', 'VITE_AUTH_SOCIAL_PROVIDERS', social.join(','))
setEnv('apps/frontend/.env.staging', 'VITE_BACKEND_URL', args['staging-api-url'])
setEnv('apps/frontend/.env.production', 'VITE_BACKEND_URL', args['production-api-url'])
step(`frontend settings: "${title}", locale ${args.locale}, sign-in with ${social.join(', ') || 'email only'}`)

replaceIn('apps/backend/.env', '@localhost:5432/monorepo_starter', `@localhost:${postgresPort}/${database}`)
replaceIn('docker-compose.yml', '${POSTGRES_DB:-monorepo_starter}', `\${POSTGRES_DB:-${database}}`)
replaceIn('docker-compose.yml', "'${POSTGRES_PORT:-5432}:5432'", `'\${POSTGRES_PORT:-${postgresPort}}:5432'`)
step(`database ${database} on localhost:${postgresPort}`)

write('apps/backend/.env.local', `# Local secrets (git ignored), loaded over apps/backend/.env.\nBETTER_AUTH_SECRET=${randomBytes(32).toString('base64')}\n`)
step('generated BETTER_AUTH_SECRET in apps/backend/.env.local')

// ---------------------------------------------------------------- 3. agent docs and README

const intro = `${description}

Scaffolded on ${today} from [@volverjs/monorepo-starter](https://github.com/volverjs/monorepo-starter):
an Nx + pnpm monorepo with a Vue 3 SPA on the Volver design system, a Fastify API, PostgreSQL
through Drizzle ORM and authentication with better-auth.`
replaceIn('AGENTS.md', '# @volverjs/monorepo-starter\n', `# ${title}\n`)
{
    const content = read('AGENTS.md')
    const block = /<!-- scaffold:intro -->\n[\s\S]*?<!-- \/scaffold:intro -->\n/
    if (!block.test(content)) {
        fail('template changed: no scaffold:intro block in AGENTS.md. Update scripts/scaffold.mjs.')
    }
    write('AGENTS.md', content.replace(block, () => `${intro}\n`))
}
stripStarterOnly('AGENTS.md')
stripStarterOnly('CLAUDE.md')
step('AGENTS.md and CLAUDE.md rewritten for the project')

write(
    'README.md',
    `# ${title}

${intro}

## Requirements

- [Node.js](https://nodejs.org/) 24.12 or newer (22.20 or newer on the 22 line)
- [pnpm](https://pnpm.io/): the version in \`packageManager\` is fetched automatically
- [Docker](https://www.docker.com/) for the local database, which the integration tests use too

## Getting started

\`\`\`bash
docker compose up -d postgres
pnpm install
pnpm db:migrate
pnpm dev
\`\`\`

- Frontend: https://localhost:8080
- Backend: https://localhost:3000, API reference at \`/swagger\` and \`/scalar\`
- PgAdmin (\`docker compose up -d pgadmin\`): http://localhost:5050

Local secrets live in \`apps/backend/.env.local\` (git ignored): the scaffold generated
\`BETTER_AUTH_SECRET\` there. Every other backend setting, and a placeholder for each secret, is
documented in \`apps/backend/.env\`; the public frontend settings are in \`apps/frontend/.env*\`.

## Scripts

| Command | What it does |
| --- | --- |
| \`pnpm dev\` | Backend and frontend dev servers |
| \`pnpm verify\` | Lint, typecheck, tests and production builds, with Postgres up: run it before every commit |
| \`pnpm build\` | Production builds (\`apps/*/dist\`) |
| \`pnpm db:generate\` | A migration from schema changes |
| \`pnpm db:migrate\` | Apply the migrations to \`DATABASE_URL\` |

## Coding agents

[AGENTS.md](AGENTS.md) holds the conventions, the architecture and the Definition of Done, and
[docs/agents/](docs/agents/) the traps and checklists: both are loaded by coding agents, and are
worth a read for humans too. [CLAUDE.md](CLAUDE.md) adds what is specific to Claude Code. The
\`todo\` resource is the worked example of every layer: a new resource starts as a copy of it
([docs/agents/new-resource.md](docs/agents/new-resource.md)).
`,
)
step('README.md written for the project')

if (args.license === 'MIT') {
    let author = args.author
    if (!author) {
        try {
            author = execFileSync('git', ['config', 'user.name']).toString().trim()
        } catch {
            author = ''
        }
    }
    if (!author) {
        fail('--license MIT needs --author (git user.name is not set)')
    }
    const license = read('LICENSE').replace(/^Copyright \(c\) .*$/m, () => `Copyright (c) ${today.slice(0, 4)} ${author}`)
    write('LICENSE', license)
    step(`MIT license for ${author}`)
} else {
    fs.rmSync(file('LICENSE'), { force: true })
    step('license UNLICENSED, LICENSE removed')
}

// ---------------------------------------------------------------- 4. leftovers check

const leftovers = []
const textFiles = fs
    .readdirSync(target, { recursive: true })
    .filter((entry) => !/(^|\/)(node_modules|\.git)(\/|$)|pnpm-lock\.yaml$|\.(png|svg|ico|woff2?)$/.test(entry))
    .filter((entry) => fs.statSync(file(entry)).isFile())
for (const relative of textFiles) {
    const content = read(relative)
    for (const needle of ['monorepo_starter', 'Volver.js Startup Template', 'starter-only', 'scaffold:intro', 'scaffold:check']) {
        if (content.includes(needle)) {
            leftovers.push(`${relative}: ${needle}`)
        }
    }
}
if (leftovers.length) {
    fail(`template text left in the project, update scripts/scaffold.mjs:\n  ${leftovers.join('\n  ')}`)
}
step('no template name left in the project')

// ---------------------------------------------------------------- 5. git, install, migrations, verify

if (!args['no-git']) {
    run('git', ['init', '--quiet', '--initial-branch=main'])
    step('git repository initialised on main (nothing committed)')
}

if (!args['skip-install']) {
    run('pnpm', ['install'])
    step('dependencies installed')
}

if (!args['keep-migrations']) {
    // A new project starts from one migration of the current schema, not from the history of
    // how the template got there.
    const drizzle = file('packages/database/drizzle')
    fs.rmSync(drizzle, { recursive: true, force: true })
    fs.mkdirSync(drizzle)
    run('pnpm', ['nx', 'run', 'database:generate', '--name=init'])
    // drizzle-kit exits 0 when it cannot run: check that the migration exists.
    if (!fs.readdirSync(drizzle).some((entry) => /^0000_init\.sql$/.test(entry))) {
        fail('drizzle-kit did not write packages/database/drizzle/0000_init.sql')
    }
    step('migrations replaced by packages/database/drizzle/0000_init.sql')
}

if (!args['skip-verify']) {
    // The integration tests of `pnpm verify` run on the project's own Postgres
    // (docker-compose.yml, on the chosen port).
    if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0) {
        run('docker', ['compose', 'up', '--detach', '--wait', 'postgres'])
        step(`Postgres started on localhost:${postgresPort} (docker compose)`)
        run('pnpm', ['verify'])
        step('pnpm verify passed')
        // Nx does not print the output of a task that passed: the database the
        // suite creates is the proof that the integration tests ran here.
        const probe = spawnSync(
            'docker',
            ['compose', 'exec', '-T', 'postgres', 'sh', '-c', `psql -U "$POSTGRES_USER" -tAc "select 1 from pg_database where datname = '${database}_test'"`],
            { cwd: target, encoding: 'utf8' },
        )
        step(
            probe.stdout?.trim() === '1'
                ? `integration tests ran on localhost:${postgresPort} (database ${database}_test)`
                : `NOT CONFIRMED: no database ${database}_test on localhost:${postgresPort}, the integration tests ran elsewhere or not at all`,
        )
    } else {
        // `pnpm verify` step by step, with the unit tests only
        for (const verifyStep of VERIFY_STEPS) {
            const [command, ...commandArgs] = verifyStep.split(' ')
            if (verifyStep.startsWith('nx run-many')) {
                run('pnpm', ['nx', 'run-many', '--targets=typecheck,build'])
                run('pnpm', ['nx', 'run', 'backend:test', '--', '--project', 'unit'])
            } else {
                run(command, commandArgs)
            }
        }
        step('pnpm verify passed, without the integration tests')
        step('NOT RUN: the integration tests (no Docker). Start Docker, then `docker compose up -d postgres` and `pnpm verify`')
    }
}

if (args.json) {
    console.log(JSON.stringify(report, null, 2))
} else if (args.check) {
    console.log('\nscaffold check passed: every edit still applies to the template')
} else {
    console.log(`
Done: ${target}

Next steps:
  cd ${target}
  docker compose up -d postgres   # Postgres on ${postgresPort}, PgAdmin: docker compose up -d pgadmin
  pnpm db:migrate
  pnpm dev
${social.length ? `\nSocial sign-in (${social.join(', ')}): put the credentials in apps/backend/.env.local.` : ''}
Replace the Volver logo and icons: packages/icons/src/logo.svg, apps/frontend/public/*.`)
}
