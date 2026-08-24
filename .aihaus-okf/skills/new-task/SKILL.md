---
name: new-task
description: Create a kanban task — generate a team-merge-safe ID T-<yyMMdd>-<rand6>, then write memory/kanban/backlog/<id>--<slug>.md with the standard frontmatter + body. The only correct way to mint a task ID.
when-to-use: When starting a new unit of work, capturing a backlog item, or splitting work out of a larger task. Never hand-pick the random suffix — always use this recipe.
allowed-tools: Bash, Write
---

# new-task — mint a kanban task

One task = one markdown file. **Its status is its folder.** New tasks start in
`memory/kanban/backlog/` (or `todo/`). The ID is **immutable** once created.

## ID format: `T-<yyMMdd>-<rand6>`
- `<yyMMdd>` — today's date (sorts chronologically).
- `<rand6>` — **6 lowercase base36 chars** (`0-9a-z`). The random suffix makes two
  teammates creating tasks offline **collide-safe** when branches merge (~2 billion/day).
- Example: `T-260623-k7f2qa`

### Generate it deterministically (don't hand-pick)
Run this and use the printed ID verbatim:

```bash
node -e 'const d=new Date(),p=n=>String(n).padStart(2,"0");const date=`${String(d.getFullYear()).slice(-2)}${p(d.getMonth()+1)}${p(d.getDate())}`;const r=[...require("crypto").randomBytes(6)].map(b=>(b%36).toString(36)).join("");console.log(`T-${date}-${r}`)'
```

POSIX-shell fallback (no Node): date prefix + a crypto-random base36 token —
```bash
printf 'T-%s-%s\n' "$(date +%y%m%d)" "$(LC_ALL=C tr -dc '0-9a-z' </dev/urandom | head -c6)"
```

Both derive `rand6` from a **cryptographic random token**, lowercased to base36. Never
reuse an ID, never edit the random part after creation.

## Filename: `<id>--<slug>.md`
- `slug` is kebab-case, derived from the title, **editable later**; the `<id>` prefix is not.
- Example: `T-260623-k7f2qa--fix-login-redirect.md`
- Path: `memory/kanban/backlog/<id>--<slug>.md`

## Write the file
Use this exact shape (frontmatter + body):

```markdown
---
id: T-260623-k7f2qa        # immutable — from the recipe above
title: Fix login redirect loop
status: backlog            # mirrors the folder it lives in
owner: vic                 # who holds it (or "-" if unassigned)
workflow: bugfix           # which workflows/ lane drives it (optional)
created: 2026-06-23
links: []                  # related tasks, decisions, PRs
---

## Goal
What "done" means, in one or two sentences.

## Context
Pointers (not copies): memory/project pages, codebase query refs (path:line), prior tasks.

## Checklist
- [ ] step
- [ ] step

## Log
- 2026-06-23 — created
```

## Rules
- `status` in frontmatter must **match the folder**. Moving the file = changing status
  (`backlog → todo → doing → review → done`); update the field when you move it.
- Keep **Context** as pointers, not copies — link `memory/project/` pages and `path:line`
  refs from `query-codebase`; don't paste their contents.
- Durable outcomes don't live here — promote them to `memory/project/` via `promote-memory`.
