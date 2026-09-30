# Claude Code notes

The project conventions, architecture and commands live in AGENTS.md, shared with every other
coding agent. It is imported here, do not duplicate its content in this file:

@AGENTS.md

What follows is specific to Claude Code.

## Skills

Where skills come from is in AGENTS.md. In Claude Code a skill installed through two channels
loads twice, so keep one channel per skill.

- **Volver**: one plugin per library, from the `volverjs/claude-plugins` marketplace (the
  organization copy on claude.ai is `volverjs/claude-plugins-org`). Each answers as
  `/volverjs-style:volverjs-style` and so on. A session without the organization sync adds the
  public marketplace and installs the plugins it needs.
- **Vendored** third-party skills from `skills-lock.json` are installed into `.claude/skills/`
  by `npx skills experimental_install` (git ignored).
<!-- starter-only -->
- **The scaffolding skill** of this repository is read from `skills/` when you work here. To
  scaffold from anywhere else, install it once: as the `volverjs-monorepo-starter` plugin, or
  with `npx skills add volverjs/monorepo-starter -g`.
<!-- /starter-only -->

Invoke before working, besides the Volver skills AGENTS.md names for the frontend:

- `vue`, `vue-best-practices` or `pinia` for non-trivial frontend work;
- `fastify-best-practices`, `node` or `typescript-magician` for backend plumbing and type work;
- `vitest` or `vue-testing-best-practices` when writing tests.

## MCP servers

Declared in `.mcp.json`: `nx-mcp`, the workspace graph, project targets and Nx docs. Prefer it
over guessing Nx CLI flags.

## Hooks, permissions and env

`.claude/settings.json` is committed. It turns off the agent attribution on commits and PRs,
allows the verification scripts (`pnpm verify`, `lint`, `typecheck`, `test`, `build`) without a
prompt, and runs [.claude/hooks/guard.mjs](.claude/hooks/guard.mjs) before every Bash, Write
and Edit call. The guard refuses a direct `vitest`, `tsc`, `vue-tsc`, `vite` or `drizzle-kit`
run, an em or en dash added to Markdown or to a commit message or PR text, and an agent
signature, with the reason the model reads. Everything else in `.claude/` stays out of git.

`.claude/settings.local.json` is user-local. Node does not trust the vite-plugin-mkcert
certificates of the dev servers, so a script or test that calls `https://localhost` needs the
root CA there:

```json
{ "env": { "NODE_EXTRA_CA_CERTS": "/Users/<you>/.vite-plugin-mkcert/rootCA.pem" } }
```

## Memory versus repo

Durable, team-relevant knowledge belongs in the repo: AGENTS.md for conventions,
[docs/agents/](docs/agents/) for traps and checklists. Write it there, not in memory, and do
not keep both copies: they diverge.

Memory is for what must not be committed: credentials and hosts of real environments, open
investigations that are not yet documentation, personal working preferences.
