---
name: map-codebase
description: (Re)build the code index by scanning the host project's source. The ONLY skill that writes memory/codebase/. Use after code changes land or when `status` reports the index stale.
when-to-use: After implementation/bugfix code lands; when `index.mjs status` says stale (source newer than last build) or the backend dropped to lexical; on a fresh clone with no index; whenever a workflow marks a step `> 🔍 codebase: update`.
allowed-tools: Bash
---

# map-codebase — build the code index

This is the **write** side of `memory/codebase/`. It scans the host project's
**source code only** and (re)builds the rebuildable vec index. It is the **only**
thing that writes the index — agents never hand-edit `index.sqlite` or `graph.json`.

## When to run
- **After code changes land** (the `feature`/`bugfix` lanes mark this `> 🔍 codebase: update`).
- When **`status` says stale** — source files are newer than the last build.
- On a **fresh checkout** where `index.sqlite`/`graph.json` don't exist yet.
- When `status` shows the backend fell back to `lexical` and you want it back on `bge-m3`.

## How to run
Always check first, then build:

```bash
node .aihaus-okf/tools/index.mjs status              # freshness + backend (bge-m3 | lexical)
node .aihaus-okf/tools/index.mjs build               # full (re)build from project source
node .aihaus-okf/tools/index.mjs update <paths...>   # incremental: only changed files
```

- `build` = full rebuild. Use on a fresh index or when many files changed.
- `update <paths…>` = cheap incremental refresh. Prefer it after a small edit set.

## What it writes
Everything lands under `memory/codebase/` (both data files are **git-ignored** and disposable):
- `index.sqlite` — sqlite-vec store (`code_vectors`, 1024-dim) + a `vector_chunks` table.
- `graph.json` — symbol/relationship graph (callers, imports) for `callers`/`impact`, **plus the
  lexical inverted index** (token postings used when semantic is off).

The committed `memory/codebase/README.md` is the access protocol, not data — leave it alone.

## Scope (do not widen)
- **Source code only.** `.md`, `.json`, `.yaml`, and everything under `memory/` are
  **never embedded** — project memory is markdown, addressed by name, not by similarity.
- Embeddings run locally via **Ollama `bge-m3`**; nothing leaves the machine. If Ollama
  isn't running, the build still completes in **lexical** mode and `status` says so.

## Rules
- **Markdown/code wins over the index.** A stale index is a signal to run this skill,
  not to distrust the engine or argue with the code.
- This skill **only writes**. To *read* the index (where is X / who calls Y / blast radius),
  use the `query-codebase` skill — never the other way around.
