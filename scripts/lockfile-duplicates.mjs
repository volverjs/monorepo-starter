// Reports packages that pnpm-lock.yaml resolves at more than one version.
//
// Two copies of a package that other packages augment or compare by identity
// (vue, pinia, vue-i18n, zod, better-auth...) do not fail at install time: they
// fail as type errors that name no version, or as a plugin that silently never
// registers. The packages in WATCHED fail the check, every other duplicate is
// only listed. To collapse one: `pnpm update -r <name>`, then run this again.
import { readFileSync } from 'node:fs'

const WATCHED = [
    /^vue$/,
    /^vue-router$/,
    /^vue-i18n$/,
    /^pinia$/,
    /^zod$/,
    /^typescript$/,
    /^@vueuse\//,
    /^@volverjs\//,
    /^better-auth$/,
    /^@better-auth\//,
    /^drizzle-orm$/,
    /^fastify$/,
]

const lockfile = readFileSync(new URL('../pnpm-lock.yaml', import.meta.url), 'utf8')
const start = lockfile.indexOf('\npackages:\n')
const end = lockfile.indexOf('\nsnapshots:\n')
const versions = new Map()
for (const line of lockfile.slice(start, end).split('\n')) {
    const match = line.match(/^ {2}'?(@?[^@\s']+)@([^:'(]+)'?:\s*$/)
    if (match) {
        const [, name, version] = match
        versions.set(name, (versions.get(name) ?? new Set()).add(version))
    }
}

const duplicated = [...versions].filter(([, set]) => set.size > 1)
const blocking = duplicated.filter(([name]) => WATCHED.some((re) => re.test(name)))
for (const [name, set] of duplicated) {
    const mark = blocking.some(([n]) => n === name) ? 'ERROR' : 'info '
    console.log(`${mark} ${name}: ${[...set].join(', ')}`)
}
if (blocking.length) {
    console.error(`\n${blocking.length} watched package(s) resolved twice, see the comment in ${import.meta.filename}`)
    process.exit(1)
}
console.log(`lockfile: ${duplicated.length} duplicated package(s), none watched`)
