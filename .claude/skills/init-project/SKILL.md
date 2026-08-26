---
name: init-project
description: Set up the aihaus-okf engine for a specific project — run a deterministic scan, dispatch researchers in parallel to investigate the real repo, then personalize memory/project/, conventions.md, and the code index with REAL discovered facts. Idempotent and gated; never invents, never clobbers human edits.
when-to-use: Once, on a fresh clone where the engine is generic and memory/project/ pages are still stubs. Re-run to refresh after a big stack/structure change. Run before the feature/bugfix lanes so workers have real project context to load.
allowed-tools: Bash, Read, Edit, Write
---

# init-project — personalize the engine for this repo

The portable engine ships generic: empty `memory/project/` stubs, a generic
`conventions.md`, no code index. This skill makes it **this project's** brain — by
investigating the real repo and writing back only what it actually found. It is an
**orchestrated** procedure: the orchestrator runs the steps and dispatches workers
(spawning them in whatever harness hosts the engine).

## Two hard rules
> **Discover, never invent.** Every fact written back cites repo evidence (`path:line`, a
> manifest, a command). Unknowns are left as `unknown` / `Open questions`, not guessed.
>
> **Gated, never clobbering.** A page a human has edited is never overwritten — it is
> skipped and noted. Workers PROPOSE; the orchestrator PROMOTES (the `promote-memory` rule).

## Procedure

### 0. Deterministic baseline — `orchestrator`
Run the read-only detector first so every worker starts from the same facts:
```bash
node .aihaus-okf/tools/scan.mjs --json
```
It reports languages, package managers + manifests, build/test/run/lint/dev commands,
frameworks, entry points, monorepo workspaces, VCS, and rough file/LOC counts. It **writes
nothing**. Keep the JSON as the shared baseline handed to each worker below.

### 1. Investigate the repo — `researcher` ×N, in parallel
Dispatch researcher-class workers **in parallel**, one per area, each given the scan JSON
and a tight scope. Each returns **pointers + findings** (`path:line`, manifest refs, command
output) — never pasted prose to copy verbatim:
- **architecture & stack** — components, entry points, how it's layered → `project.md`, `knowledge.md`
- **build & deploy** — how it builds, runs, ships; CI/Docker → `environment.md`, `deployment.md`
- **conventions & tests** — real test-file pattern, naming, lint/format, the actual test/build commands → `conventions.md`, `procedures.md`
- **domain & glossary** — the terms this codebase uses → `glossary.md`
- **candidate business rules** — invariants/guards inferred from code (validations, constraints) → `business-rules.md` (PROPOSED only — see step 2)

> 🔍 codebase: query

### 2. Populate project memory — `orchestrator` (via `promote-memory`)
For each page, the orchestrator promotes the worker findings into `memory/project/` —
`project.md`, `environment.md`, `knowledge.md`, `glossary.md`, `deployment.md`, `procedures.md`.
- Write the **`## Current truth`** an agent should rely on; push uncertainty to **`## Open
  questions`**; cite evidence in **`## Details`**; bump `last_reviewed`.
- **`business-rules.md` is gated.** Candidate rules are **PROPOSED for user approval** first —
  the orchestrator promotes only the ones the human accepts. Never auto-accept an inferred rule.
- **Idempotent:** a stub page is filled; a page a human has edited is **skipped and listed**.

### 3. Personalize conventions — `orchestrator`
Update `conventions.md` to match what step 1 found: the real **test-file pattern**, the
**component/naming** convention, and the detected **test/build commands**. Note which
`workflows/` lanes apply to this project. Leave the okf naming rules (task IDs, page set,
folders) untouched — only the project-shaped parts change.

### 4. Build the code index — `implementer` (via `map-codebase`)
Dispatch the `map-codebase` skill to build the index from source so later tasks can query it:
```bash
node .aihaus-okf/tools/index.mjs status   # then build
node .aihaus-okf/tools/index.mjs build
```
> 🔍 codebase: update

### 5. Seed tasks + summarize — `orchestrator` (via `new-task`, optional)
Optionally mint initial kanban tasks from TODOs / an issue tracker via the `new-task` skill
(never hand-pick the ID). Then print a summary: **what was written**, **what was skipped**
(human-authored pages), **what was proposed** (business rules awaiting approval), and a clear
**next steps** note for anything left `unknown`.

## Idempotency & re-runs
- Safe to re-run. It refills stubs and refreshes the index; it **never** overwrites a page a
  human has touched without asking.
- It makes **no commits** and changes **no branches** — only `memory/` and `conventions.md`.
- References only real engine pieces: the `scan.mjs` tool, the six roles in
  `agents/catalog.yaml`, and the `promote-memory` / `map-codebase` / `new-task` skills.
