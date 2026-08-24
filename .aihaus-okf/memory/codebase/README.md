# memory/codebase — the rebuildable code index (vec)

> This is the **one** place aihaus-okf uses vectors — and it is a **cache over source code
> only**, never the brain. It exists to answer "where is X / who calls Y / what's the blast
> radius" fast. If it disagrees with the actual code or with `memory/project`, the code wins
> and this index is stale. Rebuild it; don't argue with it.

_Last updated: 2026-06-23_

## What's here
- `index.sqlite` — sqlite-vec store: `code_vectors(embedding float[1024])` + a `vector_chunks` table. **git-ignored.**
- `graph.json` — symbol/relationship graph (callers, imports) **and the lexical inverted index** (token postings, used when semantic is off). **git-ignored.**
- This `README.md` — the access protocol (committed).

Both data files are **disposable**: delete them and run a rebuild to recreate from source.

## Embeddings
- Backend: **local Ollama `bge-m3`** (1024-dim). Nothing leaves the machine.
- **Scope: source code only.** `.md`, `.json`, `.yaml`, and everything under `memory/` are
  **never embedded** — project memory is markdown, addressed by name, not by similarity.
- **Graceful fallback:** if Ollama is not running, the tool degrades to **lexical** — a pure-JS
  inverted token index (IDF token-overlap) kept in `graph.json` — and says so in `status`. The
  engine still works; it's just keyword-based, not semantic.

## How an agent uses it (the protocol)

All access is via one tool: `node .aihaus-okf/tools/index.mjs <command>`.

| Command | Use |
|---|---|
| `status` | Check freshness, file counts, and whether the backend is `bge-m3` or `lexical`. Run this first. |
| `query "<text>" [--top N] [--json]` | **READ.** Semantic+lexical retrieval. Returns ranked `path:line` refs with snippets. |
| `callers <symbol>` / `impact <path>` | **READ.** Graph lookups: who calls this / what this change touches. |
| `build` | **WRITE.** Full (re)build from project source. Use the `map-codebase` skill. |
| `update [paths…]` | **WRITE.** Incremental refresh for changed files. |

**Read rule:** before searching the codebase by hand, `query` it. Treat results as *pointers* —
open the real file at the returned `path:line` to confirm; never quote the index as truth.

**Write rule:** rebuild/refresh the index **after** code changes land (the `feature`/`bugfix`
workflows mark the step with `> 🔍 codebase: update`). Building is the only thing that writes
here; agents never hand-edit `index.sqlite` or `graph.json`.

**Staleness:** `status` flags the index stale if source is newer than the last build. A stale
index is a signal to run `map-codebase`, not to distrust the engine.

## Inside workflows — the `🔍 codebase:` markers

Workflow lanes mark exactly where the index is touched, so context **ingestion** and result
**persistence** are explicit, not implicit:
- **`> 🔍 codebase: query`** — *ingest* here: before reasoning about code, pull context from the
  index with the `query-codebase` skill (`status` → `query` / `callers` / `impact`). It sits on the
  context / mapping / review stages of the code-aware lanes.
- **`> 🔍 codebase: update`** — *persist* here: after the change lands, refresh the index with the
  `map-codebase` skill (`update <paths>` or `build`) so the next task sees it. It sits on the land
  stage of the code-landing lanes (feature / bugfix / quick / test).

Read goes through `query-codebase`; write goes through `map-codebase`; this README is the protocol
both follow.
