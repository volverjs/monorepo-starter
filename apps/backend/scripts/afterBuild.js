// Writes dist/package.json, the manifest the deployed backend installs with
// `npm install --omit=dev`: workspace packages are bundled by Vite, so only
// the npm dependencies stay, and `start` is the only script that can run there.
import fs from 'fs'
import { builtinModules } from 'module'
import path from 'path'
import process from 'process'

const dist = path.resolve(import.meta.dirname, '../dist')
const packageJson = JSON.parse(
    fs.readFileSync(
        path.resolve(import.meta.dirname, '../package.json'),
        'utf8',
    ),
)

packageJson.scripts = { start: packageJson.scripts.start }
for (const key in packageJson.dependencies) {
    if (packageJson.dependencies[key].startsWith('workspace:')) {
        delete packageJson.dependencies[key]
    }
}
delete packageJson.devDependencies

// Every package the bundle still imports must be installable from this
// manifest. One listed only in devDependencies, or only by a workspace package,
// builds fine and stops the deployed backend at startup (it happened with
// openapi-types, whose `OpenAPIV3` is a runtime value).
const bundle = fs.readFileSync(path.join(dist, 'main.js'), 'utf8')
const imported = new Set()
for (const match of bundle.matchAll(
    /^\s*(?:import|export)\s[^;'"]*?\bfrom\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gm,
)) {
    const specifier = match[1] ?? match[2] ?? match[3]
    if (/^[./]/.test(specifier)) {
        continue
    }
    const parts = specifier.split('/')
    imported.add(
        specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0],
    )
}
const missing = [...imported].filter(
    (name) =>
        !name.startsWith('node:') &&
        !builtinModules.includes(name) &&
        !(name in (packageJson.dependencies ?? {})),
)
if (missing.length) {
    console.error(
        `dist/main.js imports ${missing.join(', ')}, which apps/backend/package.json does not list in dependencies: the deployed backend would not start.`,
    )
    process.exit(1)
}

fs.writeFileSync(
    path.join(dist, 'package.json'),
    JSON.stringify(packageJson, null, 2),
)
