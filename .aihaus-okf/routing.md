# Routing — read this first

> This is the **Map** (okf Layer 1). It is a router, not a brief. It tells any agent —
> Claude, Cursor, or Codex — *where to go, what to read, and which skill to load* for a
> given task. Keep it short. Detail lives in the workspace each row points to.

_Last updated: 2026-06-23_

## What this engine is

`aihaus-okf` turns a folder into a working brain. Three layers:

1. **Map** — the thin root agent file (`CLAUDE.md` / `AGENTS.md` / `.cursor/rules/…`) +
   this `routing.md`.
2. **Rooms** — the folders under `.aihaus-okf/`, each with its own context. Load only the
   room a task needs.
3. **Tools** — `skills/` (loaded on demand) and `tools/` (the code indexer).

**Memory model:** `memory/project/` is the durable markdown brain; `memory/kanban/` is the
work board; `memory/codebase/` is a *rebuildable* vec index over source code only. Everything
project-specific lives under `memory/`. The rest of `.aihaus-okf/` (`workflows/`, `agents/`,
`skills/`, `tools/`) is the **portable engine** — identical across projects.

_For a fuller tour of the layout, see `.aihaus-okf/README.md`._

## Routing table

| If the task is… | Go to | Read | Skill / tool |
|---|---|---|---|
| Start, pick up, or move a unit of work | `memory/kanban/` | `kanban/README.md` + the `T-*--*.md` task file | `new-task` |
| Run a process (feature / bug / test / research / plan / ops / quick) | `workflows/` | the matching `*.md` lane | (lane names its agents) |
| Set up or personalize the engine for a new project | `.aihaus-okf/` | `skills/init-project/SKILL.md` | `init-project` |
| Need a project fact, rule, decision, or term | `memory/project/` | the relevant typed page | `promote-memory` (to write) |
| Need code context (where is X, callers, blast radius) | `memory/codebase/` | `codebase/README.md` | `query-codebase`; rebuild via `map-codebase` |
| Act in a specialist role | `agents/` | `catalog.yaml` + the role file | — |
| Need a specific how-to | `skills/` | the matching `SKILL.md` | — |
| Naming / file conventions | `.aihaus-okf/` | `conventions.md` | — |

## Operating rules

1. **Read this file and `conventions.md` before acting.** Do not load everything.
2. **One room at a time.** Pull only the folder the routing row points to — no bleed.
3. **Project state goes under `memory/`.** Never scatter project files elsewhere.
4. **Markdown wins over the index.** `memory/codebase` is a cache; if it's stale, rebuild
   it with `map-codebase`, never trust it over the code or `memory/project`.
5. **Memory writes are deliberate.** Propose changes to `memory/project/` via `promote-memory`;
   don't silently rewrite the brain.
6. **Keep the Map small.** If the root agent file grows past ~50 lines, push detail down into
   the room it belongs to.
