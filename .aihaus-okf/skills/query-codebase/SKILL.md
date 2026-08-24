---
name: query-codebase
description: READ the code index — semantic+lexical retrieval and graph lookups (query/callers/impact). Returns path:line pointers; open the real file to confirm. Never quote the index as truth.
when-to-use: Before searching the codebase by hand — to find where something lives, who calls a symbol, or the blast radius of a change. Any task whose routing row says "Need code context".
allowed-tools: Bash, Read
---

# query-codebase — read the code index

The **read** side of `memory/codebase/`. Mirrors `memory/codebase/README.md`.
All access is one CLI: `node .aihaus-okf/tools/index.mjs <command>`.

## Commands
| Command | Use |
|---|---|
| `status` | Freshness, file counts, backend (`bge-m3` or `lexical`). **Run this first.** |
| `query "<text>" [--top N] [--json]` | Semantic+lexical retrieval. Ranked `path:line` refs with snippets. |
| `callers <symbol>` | Graph lookup: who calls this. |
| `impact <path>` | Graph lookup: what a change here touches. |

```bash
node .aihaus-okf/tools/index.mjs status
node .aihaus-okf/tools/index.mjs query "where is the auth redirect handled" --top 8
node .aihaus-okf/tools/index.mjs callers handleLogin
node .aihaus-okf/tools/index.mjs impact src/auth/session.ts
```

## The read protocol
1. **`status` first.** If it reports **stale**, the index is behind the code —
   run the `map-codebase` skill before trusting hits (or proceed knowing they may lag).
2. **Query before hand-searching.** `query` instead of grepping blind.
3. **Hits are pointers, not answers.** Each result is a `path:line` ref. **Open the real
   file** at that location with Read to confirm before you act on it.
4. **Never quote the index as truth.** If the index disagrees with the code or with
   `memory/project`, **the code/markdown wins and the index is stale.** Cite the file, not the hit.

## Lexical fallback
If Ollama isn't running, the tool degrades to **lexical** — a JS inverted-index (IDF
token-overlap) kept in `graph.json` — and says so in `status`. Retrieval still works — it's
just keyword-based, not semantic, so widen your
query terms and lean harder on confirming in the file.

## Boundaries
- **Read only.** This skill never writes the index. Building/refreshing is the
  `map-codebase` skill's job.
- **Code only.** The index covers source, not `memory/`. For project facts, rules, and
  decisions, read `memory/project/` directly — those are never embedded.
