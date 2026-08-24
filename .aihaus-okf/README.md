# .aihaus-okf — the engine

A folder that turns plain files into a working brain for coding agents (Claude, Cursor,
Codex). No runtime, no build step, no vector DB for memory. Just **markdown + folders +
naming**, plus one rebuildable code index.

## Layout
```
.aihaus-okf/
├── routing.md        # the Map — read first
├── conventions.md    # naming rules (the database replacement)
│
├── workflows/        # processes: feature · bugfix · test · research · planning · quick · ops  ── PORTABLE ENGINE
├── agents/           # specialist roles + catalog.yaml                                    ── PORTABLE ENGINE
├── skills/           # invokable how-tos (init-project, map-codebase, query-codebase, …)   ── PORTABLE ENGINE
├── tools/            # code indexer (index.mjs) + project detector (scan.mjs) + setup.mjs  ── PORTABLE ENGINE
│
└── memory/           # ── EVERYTHING PROJECT-SPECIFIC LIVES HERE ──
    ├── project/      # durable markdown brain (rules, decisions, knowledge, …)
    ├── codebase/     # rebuildable vec index over source code (git-ignored)
    └── kanban/       # the work board (tasks as files; status = folder)
```

## The split that matters
- **Engine** (`workflows/ agents/ skills/ tools/`) is identical across projects — update it
  by pulling a new version of aihaus-okf.
- **Memory** (`memory/**`) is *this* project's state — it is what you keep, diff, and (for
  `project/` + `kanban/`) commit for team work. `memory/codebase/` is the only disposable part.

## Three layers (okf)
1. **Map** — `routing.md` + the thin root agent file (`CLAUDE.md`/`AGENTS.md`/`.cursor`).
2. **Rooms** — the folders above; load only the one a task needs (no bleed).
3. **Tools** — `skills/` (on demand) + `tools/` (the indexer).

Start every task at `routing.md`. Keep the Map small; grow the rooms from real use.
