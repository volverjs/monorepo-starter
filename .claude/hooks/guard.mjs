#!/usr/bin/env node
// PreToolUse guard for the conventions in AGENTS.md that a model tends to skip:
//   - tooling runs through nx or the root scripts, never vitest, tsc, vue-tsc, vite or
//     drizzle-kit directly
//   - no em or en dashes in Markdown prose, commit messages or PR bodies
//   - no agent signature (Co-Authored-By trailer, "Generated with" line) on commits and PRs
// It reads the hook payload on stdin and answers with a deny decision and the reason, which the
// model reads. Any failure of its own lets the call through: a broken guard must not stop work.
import { existsSync, readFileSync } from 'node:fs'

const DIRECT_TOOLS = new Set(['vitest', 'tsc', 'vue-tsc', 'vite', 'drizzle-kit'])
// Prefixes that run the command after them: stripped until the real program is first.
const PREFIXES = [
    /^(\w+=\S*\s+)+/,
    /^env(\s+-\S+)*\s+/,
    /^(command|builtin|exec|nohup|time)\s+/,
    /^nice(\s+-n\s*-?\d+|\s+-\d+)?\s+/,
    /^timeout(\s+-\S+)*\s+\S+\s+/,
    /^npx\s+(-y\s+)?/,
    /^pnpm\s+(exec|dlx)\s+/,
    /^pnpm\s+(?!nx\b|run\b)(?=\S)/,
    /^yarn\s+/,
    /^bunx\s+/,
]
const PUBLISH = /^git\s+(-[Cc]\s+\S+\s+)*commit\b|^gh\s+pr\s+(create|edit)\b/
const DASHES = /[–—]/g
const PROSE_EXEMPT = [/\/node_modules\//, /\/\.agents\/skills\//, /\/\.claude\/skills\//]
const SIGNATURE = /co-authored-by:|generated with \[?claude code/i

function deny(reason) {
    process.stdout.write(
        JSON.stringify({
            hookSpecificOutput: {
                hookEventName: 'PreToolUse',
                permissionDecision: 'deny',
                permissionDecisionReason: reason,
            },
        }),
    )
    process.exit(0)
}

function countDashes(text) {
    return (String(text ?? '').match(DASHES) ?? []).length
}

/**
 * Shell segments of a command, heredoc bodies and quoted strings left out: a `|` inside
 * `grep -E "vite|tsc"` is an argument, not a pipe, and must not start a segment.
 */
function segments(command) {
    const withoutHeredocs = command.replace(/<<-?\s*['"]?(\w+)['"]?[^\n]*\n[\s\S]*?\n\s*\1\b/g, '')
    const withoutQuotes = withoutHeredocs.replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, "''")
    return withoutQuotes
        .split(/\n|&&|\|\||;|\|/)
        .map((part) => part.trim())
        .filter(Boolean)
}

/** The segment from the program it actually runs: `env X=1 timeout 60 npx vitest` is vitest. */
function program(segment) {
    let rest = segment
    let previous
    do {
        previous = rest
        for (const prefix of PREFIXES) {
            rest = rest.replace(prefix, '')
        }
    } while (rest !== previous)
    return rest
}

function directTool(segment) {
    const word = program(segment).split(/\s+/)[0] ?? ''
    const name = word.split('/').pop()
    return DIRECT_TOOLS.has(name) ? name : null
}

function checkBash(command) {
    const parts = segments(command)
    for (const segment of parts) {
        const tool = directTool(segment)
        if (tool) {
            deny(
                `\`${tool}\` must not run directly (AGENTS.md, Commands): go through nx or the root ` +
                    'scripts, e.g. `pnpm verify`, `pnpm nx run backend:test`, `pnpm nx run frontend:typecheck`, ' +
                    '`pnpm db:generate`.',
            )
        }
    }
    // A segment that runs git commit or gh pr, not a mention inside an argument (a grep for
    // "git commit" publishes nothing). The message itself is checked in the whole command,
    // heredoc bodies included.
    if (!parts.some((segment) => PUBLISH.test(program(segment)))) {
        return
    }
    if (SIGNATURE.test(command)) {
        deny('No agent signature on commits and PRs (AGENTS.md, Commits): drop the Co-Authored-By trailer and the "Generated with" line.')
    }
    if (countDashes(command) > 0) {
        deny('No em or en dashes in commit messages or PR text (AGENTS.md, Writing): use a colon, parentheses, a comma or a new sentence.')
    }
}

function checkProse(toolName, input) {
    const file = String(input.file_path ?? '')
    if (!/\.mdx?$/i.test(file) || PROSE_EXEMPT.some((pattern) => pattern.test(file))) {
        return
    }
    let added = 0
    if (toolName === 'Write') {
        const before = existsSync(file) ? readFileSync(file, 'utf8') : ''
        added = countDashes(input.content) - countDashes(before)
    } else if (toolName === 'Edit') {
        added = countDashes(input.new_string) - countDashes(input.old_string)
    } else if (toolName === 'MultiEdit') {
        for (const edit of input.edits ?? []) {
            added += countDashes(edit.new_string) - countDashes(edit.old_string)
        }
    }
    if (added > 0) {
        deny(
            `This change adds ${added} em or en dash${added > 1 ? 'es' : ''} to Markdown prose (AGENTS.md, ` +
                'Writing): use a colon, parentheses, a comma or a new sentence instead.',
        )
    }
}

try {
    const payload = JSON.parse(readFileSync(0, 'utf8'))
    const toolName = payload.tool_name ?? ''
    const input = payload.tool_input ?? {}
    if (toolName === 'Bash') {
        checkBash(String(input.command ?? ''))
    } else if (['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
        checkProse(toolName, input)
    }
} catch {
    // Let the call through
}
process.exit(0)
