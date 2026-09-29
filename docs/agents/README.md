# Agent handbook

Working knowledge for AI coding agents (and humans) on this monorepo: the traps, contracts and
checklists that are not visible from the code alone. The entry point is
[AGENTS.md](../../AGENTS.md) in the repository root, which is loaded automatically; the files
here are linked from it and read on demand.

| File | Read it when |
| --- | --- |
| [gotchas.md](gotchas.md) | Before non-trivial work: the index points to one file per area in [gotchas/](gotchas/), read the one you touch |
| [new-resource.md](new-resource.md) | Adding an API resource: table, model, permissions, service, controller, test |
| [ui-tour.md](ui-tour.md) | Checking a UI change on the running app, in both themes, with console errors reported |

Rules for these files:

- Every entry describes a failure that already happened, with the symptom, the reason and what
  to do instead. No generic advice.
- Each entry names the file where the fix or the reference implementation lives, so it can be
  verified instead of trusted, and the date it was measured.
- When an entry stops being true (dependency fixed upstream, code removed), delete it. A stale
  warning here is worse than a missing one.
- A rule a tool can enforce (lint, a test, the guard hook, a script) belongs in that tool; the
  entry then only says why the tool is there.
- These are agent instructions, so they are written in English.
