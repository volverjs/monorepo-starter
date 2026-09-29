// Visits the key pages of the running frontend in headless Chrome, in both
// themes, saves a screenshot of each and fails on any console error, warning or
// uncaught exception. No dependency: it drives Chrome through the DevTools
// protocol over Node's built-in WebSocket. See docs/agents/ui-tour.md.
//
//   pnpm nx run frontend:ui-tour                     public pages only
//   UI_TOUR_EMAIL=… UI_TOUR_PASSWORD=… pnpm nx run frontend:ui-tour
//   pnpm nx run frontend:ui-tour -- /backoffice/users /frontoffice/dashboard
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE_URL = process.env.UI_TOUR_BASE_URL ?? 'https://localhost:8080'
const OUT = path.resolve(import.meta.dirname, '../.ui-tour')
const PORT = Number(process.env.UI_TOUR_DEBUG_PORT ?? 9333)
const SETTLE_MS = Number(process.env.UI_TOUR_SETTLE_MS ?? 2500)
const EMAIL = process.env.UI_TOUR_EMAIL
const PASSWORD = process.env.UI_TOUR_PASSWORD
const PAGES = process.argv.slice(2).filter((arg) => arg.startsWith('/'))
const DEFAULT_PAGES = EMAIL
    ? ['/frontoffice/dashboard', '/backoffice/dashboard', '/backoffice/users', '/not-a-page']
    : ['/auth', '/auth/sign-up', '/auth/request-password-reset', '/not-a-page']

const CHROME_CANDIDATES = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
].filter(Boolean)
const chromePath = CHROME_CANDIDATES.find((candidate) => existsSync(candidate))
if (!chromePath) {
    console.error('ui-tour: no Chrome found, set CHROME_PATH')
    process.exit(2)
}

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
// The Chrome profile stays out of the repository: thousands of files that
// linters and file watchers would otherwise walk.
const profile = mkdtempSync(path.join(tmpdir(), 'ui-tour-'))

const chrome = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    // mkcert certificates are trusted by the system, not by a fresh profile
    '--ignore-certificate-errors',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--window-size=1280,860',
    'about:blank',
])

const problems = []
let socket

try {
    let target
    for (let attempt = 0; attempt < 50 && !target; attempt++) {
        try {
            const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
            target = targets.find((t) => t.type === 'page')
        } catch {
            // Chrome is still starting
        }
        if (!target) {
            await sleep(200)
        }
    }
    if (!target) {
        throw new Error('Chrome did not open its DevTools endpoint')
    }

    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))

    let nextId = 0
    const pending = new Map()
    let currentPage = 'startup'
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data)
        if (message.id && pending.has(message.id)) {
            pending.get(message.id)(message)
            pending.delete(message.id)
            return
        }
        const { method, params } = message
        if (method === 'Runtime.consoleAPICalled' && ['error', 'warning', 'assert'].includes(params.type)) {
            const text = params.args.map((arg) => arg.value ?? arg.description).join(' ')
            problems.push(`${currentPage} console.${params.type}: ${text}`)
        } else if (method === 'Runtime.exceptionThrown') {
            const details = params.exceptionDetails
            problems.push(`${currentPage} exception: ${details.exception?.description ?? details.text}`)
        } else if (method === 'Log.entryAdded' && params.entry.level === 'error') {
            problems.push(`${currentPage} ${params.entry.source}: ${params.entry.text} ${params.entry.url ?? ''}`)
        }
    })
    const send = (method, params = {}) =>
        new Promise((resolve) => {
            const id = ++nextId
            pending.set(id, resolve)
            socket.send(JSON.stringify({ id, method, params }))
        })
    const evaluate = async (expression) =>
        (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value
    const screenshot = async (name) => {
        const { result } = await send('Page.captureScreenshot', { format: 'png' })
        const file = path.join(OUT, `${name}.png`)
        writeFileSync(file, Buffer.from(result.data, 'base64'))
        return file
    }
    const waitFor = async (expression, timeoutMs = 30000) => {
        const deadline = Date.now() + timeoutMs
        while (Date.now() < deadline) {
            if (await evaluate(expression)) {
                return true
            }
            await sleep(250)
        }
        return false
    }
    const open = async (pathname) => {
        currentPage = pathname
        await send('Page.navigate', { url: new URL(pathname, BASE_URL).href })
        await sleep(SETTLE_MS)
    }

    await send('Runtime.enable')
    await send('Log.enable')
    await send('Page.enable')

    if (EMAIL && PASSWORD) {
        await open('/auth')
        // the first load of the dev server can optimize dependencies and reload
        await waitFor(`!!document.querySelector('input[name="email"]')`)
        const submitted = await evaluate(`(async () => {
            const fill = (selector, value) => {
                const input = document.querySelector(selector)
                if (!input) return false
                input.value = value
                input.dispatchEvent(new Event('input', { bubbles: true }))
                return true
            }
            const filled = fill('input[name="email"]', ${JSON.stringify(EMAIL)}) &&
                fill('input[name="password"]', ${JSON.stringify(PASSWORD)})
            await new Promise((resolve) => setTimeout(resolve, 300))
            document.querySelector('button[type="submit"]')?.click()
            return filled
        })()`)
        await waitFor(`!location.pathname.startsWith('/auth')`, 10000)
        const landed = await evaluate('location.pathname')
        console.log(`sign-in: form ${submitted ? 'submitted' : 'NOT FOUND'}, landed on ${landed}`)
        if (!submitted || landed.startsWith('/auth')) {
            problems.push(`sign-in failed for ${EMAIL} (still on ${landed})`)
        }
    }

    for (const theme of ['light', 'dark']) {
        await send('Emulation.setEmulatedMedia', {
            features: [{ name: 'prefers-color-scheme', value: theme }],
        })
        for (const pathname of PAGES.length ? PAGES : DEFAULT_PAGES) {
            await open(pathname)
            const landed = await evaluate('location.pathname')
            const name = `${theme}${pathname.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '') || '-home'}`
            const file = await screenshot(name)
            const text = String(await evaluate('document.body.innerText')).replace(/\s+/g, ' ').trim()
            console.log(`\n${theme} ${pathname} -> ${landed}\n  ${path.relative(process.cwd(), file)}\n  ${text.slice(0, 160)}`)
        }
    }
} catch (error) {
    problems.push(`tour aborted: ${error instanceof Error ? error.message : String(error)}`)
} finally {
    socket?.close()
    chrome.kill()
    await sleep(500)
    rmSync(profile, { recursive: true, force: true })
}

const unique = [...new Set(problems)]
console.log(`\n${unique.length} problem(s)${unique.length ? ':' : ''}`)
for (const problem of unique) {
    console.log(`  ${problem}`)
}
process.exit(unique.length ? 1 : 0)
