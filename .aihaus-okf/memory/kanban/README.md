# memory/kanban — the work board

> One task = one markdown file. **Its status is the folder it lives in.** Moving the file
> from `todo/` to `doing/` *is* the state change — no database, no board app. This is the
> okf "naming + folders replace the database" rule applied to work tracking.

_Last updated: 2026-06-23_

## Statuses (folders)
```
backlog/ → todo/ → doing/ → review/ → done/
```
Move a task by moving its file. Add a status by adding a folder. Keep it small.

## Task files
- **ID:** `T-<yyMMdd>-<rand6>` (e.g. `T-260623-k7f2qa`) — immutable, team-merge-safe.
  The date sorts; the 6 base36 random chars stop two teammates' offline tasks from
  colliding when branches merge. **Generate it with the `new-task` skill — never invent the
  random part by hand.**
- **Filename:** `<id>--<slug>.md` (e.g. `T-260623-k7f2qa--fix-login-redirect.md`). The slug
  is editable; the `<id>` prefix is not.
- These files **may be committed** so the board travels with the repo for team work — hence
  the collision-safe IDs.

### Frontmatter
```yaml
---
id: T-260623-k7f2qa        # immutable
title: Fix login redirect loop
status: doing              # mirrors the folder it's in
owner: vic                 # who holds it
workflow: bugfix           # which workflows/ lane drives it (optional)
created: 2026-06-23
links: []                  # related tasks, decisions, PRs
---
```

### Body shape
```
## Goal
What "done" means, in one or two sentences.

## Context
Pointers (not copies): memory/project pages, codebase query refs (path:line), prior tasks.

## Checklist
- [ ] step
- [ ] step

## Log
- 2026-06-23 — note
```

## Lifecycle
1. `new-task` creates the file in `backlog/` (or `todo/`).
2. A `workflows/` lane picks it up; the file moves `todo → doing → review → done`.
3. Durable outcomes (a rule learned, a decision made) get promoted to `memory/project/` via
   `promote-memory` — the task is the *work*, the project pages are the *memory*.
