import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json')),
    null,
    2,
)

// remove monorepo packages
delete packageJson.scripts.build
for (const key in packageJson.dependencies) {
    if (packageJson.dependencies[key].includes('workspace')) {
        delete packageJson.dependencies[key]
    }
}
delete packageJson.devDependencies

// update package.json
fs.writeFileSync(
    path.resolve(__dirname, '../dist/package.json'),
    JSON.stringify(packageJson, null, 2),
)
