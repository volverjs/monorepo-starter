// Cases for guard.mjs, run by `pnpm verify` through `node --test .claude/hooks/guard.test.mjs`.
// Payloads are built here rather than on a command line: a test command that
// mentions a commit with a dash would itself be refused by the guard.
import { execFileSync } from 'node:child_process'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const guard = new URL('./guard.mjs', import.meta.url).pathname
const dash = String.fromCharCode(0x2014)
const cases = [
    ['grep pattern naming tools', 'allow', { tool_name: 'Bash', tool_input: { command: 'ps aux | grep -E "eslint|vue-tsc|nx " | head' } }],
    ['npx vitest', 'deny', { tool_name: 'Bash', tool_input: { command: 'npx vitest run' } }],
    ['cd && pnpm exec vite build', 'deny', { tool_name: 'Bash', tool_input: { command: 'cd apps/frontend && pnpm exec vite build' } }],
    ['env prefixed tsc', 'deny', { tool_name: 'Bash', tool_input: { command: 'NODE_OPTIONS=x tsc --noEmit' } }],
    ['env wrapper around pnpm exec vite', 'deny', { tool_name: 'Bash', tool_input: { command: 'env CI=1 pnpm exec vite build' } }],
    ['command tsc', 'deny', { tool_name: 'Bash', tool_input: { command: 'command tsc --noEmit' } }],
    ['timeout npx vitest', 'deny', { tool_name: 'Bash', tool_input: { command: 'timeout 60 npx vitest run' } }],
    ['env listing piped to grep', 'allow', { tool_name: 'Bash', tool_input: { command: 'env | grep NODE' } }],
    ['pnpm nx run frontend:typecheck', 'allow', { tool_name: 'Bash', tool_input: { command: 'pnpm nx run frontend:typecheck' } }],
    ['commit with dash', 'deny', { tool_name: 'Bash', tool_input: { command: `git commit -m "a ${dash} b"` } }],
    ['commit with co-author', 'deny', { tool_name: 'Bash', tool_input: { command: 'git commit -m "x\n\nCo-Authored-By: A <a@b.c>"' } }],
    ['clean commit', 'allow', { tool_name: 'Bash', tool_input: { command: 'git commit -m "feat: add the scaffolding skill"' } }],
    ['git -C commit with dash', 'deny', { tool_name: 'Bash', tool_input: { command: `git -C ../app commit -m "a ${dash} b"` } }],
    ['heredoc commit with dash', 'deny', { tool_name: 'Bash', tool_input: { command: `git commit -F - <<'EOF'\na ${dash} b\nEOF` } }],
    ['grep for a commit command with a dash', 'allow', { tool_name: 'Bash', tool_input: { command: `grep -rn "git commit -m a ${dash} b" docs` } }],
    ['Write md with dash', 'deny', { tool_name: 'Write', tool_input: { file_path: '/tmp/x.md', content: `a ${dash} b` } }],
    ['Edit md removing a dash', 'allow', { tool_name: 'Edit', tool_input: { file_path: '/tmp/x.md', old_string: `a ${dash} b`, new_string: 'a, b' } }],
    ['Write ts with dash', 'allow', { tool_name: 'Write', tool_input: { file_path: '/tmp/x.ts', content: `a ${dash} b` } }],
]

for (const [name, expected, payload] of cases) {
    test(`${name}: ${expected}`, () => {
        const out = execFileSync('node', [guard], {
            input: JSON.stringify(payload),
        }).toString()
        const decision = out
            ? JSON.parse(out).hookSpecificOutput.permissionDecision
            : 'allow'
        assert.equal(decision, expected)
    })
}
