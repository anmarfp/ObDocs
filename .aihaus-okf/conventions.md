# Conventions — the database replacement

> aihaus-okf has **no SQL for project state and no vector DB for memory**. Files are found,
> organized, and moved **by name and by folder**. This page is the single source of truth
> for every naming rule. (The one exception — a *rebuildable* code index — is `memory/codebase`,
> which is a disposable cache over source code, never the brain. See its README.)

_Last updated: 2026-08-24_

---

## 1. Task IDs (kanban) — team-merge-safe

A task is one markdown file. Its **status is its folder**; moving the file changes status.

- **ID format:** `T-<yyMMdd>-<rand6>` where `rand6` is 6 lowercase base36 chars.
  - Example: `T-260623-k7f2qa`
  - The date prefix sorts chronologically; the random suffix makes two teammates creating
    tasks offline **collide-safe** when their branches merge (≈2 billion combinations/day).
  - The ID is **immutable** once created. It never changes when the task moves or is renamed.
- **Filename:** `<id>--<slug>.md` → `T-260623-k7f2qa--fix-login-redirect.md`
  - `slug` is kebab-case, may be edited freely; the `<id>` part must stay.
- **Location:** `memory/kanban/<status>/<filename>`
- **Generate with:** the `new-task` skill (`.aihaus-okf/skills/new-task/`) — never hand-pick the random part.
- **Statuses (folders):** `backlog → todo → doing → review → done`. Extend by adding a folder.

## 2. Project memory pages (`memory/project/`)

Typed markdown pages, addressed by name. Fixed set (from aipi's proven brain):

| File | Holds |
|------|-------|
| `project.md` | What this project is, scope, current focus |
| `business-rules.md` | Authoritative rules / invariants (the apex of truth) |
| `decisions.md` | Decision ledger (ADR-style entries, newest on top) |
| `knowledge.md` | Durable facts, how things work, gotchas |
| `environment.md` | Stack, services, config, accounts, URLs |
| `procedures.md` | Repeatable how-tos / runbooks |
| `deployment.md` | Release & deploy specifics |
| `glossary.md` | Domain terms |

Each page carries frontmatter `type · owner · status · last_reviewed` and the section shape
**`## Current truth` / `## Details` / `## Open questions` / `## Links` / `## Timeline`**.
Treat pages as **living notes**: edit the moment something changes; bump `last_reviewed`.

**Decision-ledger entries** inside `decisions.md`: `### YYYY-MM-DD — <title>` (newest first).

## 3. Workflows (`workflows/`)

One lane per file, named by intent: `feature.md`, `bugfix.md`, `test.md`, `research.md`,
`planning.md`, `quick.md`, `ops.md`. Stages run top-to-bottom; each stage names its agent
role, its exit gate, and (where relevant) a **codebase-index marker**:
- `> 🔍 codebase: query` — *ingest* context from the code index here (read via `query-codebase`)
  before acting.
- `> 🔍 codebase: update` — *persist* the result here: refresh the index (via `map-codebase`)
  so later tasks see the change.

## 4. Agents (`agents/`)

Role files named by role: `orchestrator.md`, `implementer.md`, `reviewer.md`,
`verifier.md`, `researcher.md`, `planner.md`. `catalog.yaml` is the registry (role → model
class, runtime, default skills, memory inputs).

## 5. Skills (`skills/`)

One folder per skill, each with a `SKILL.md` (frontmatter `name · description · when-to-use ·
allowed-tools`). Invokable on demand — loaded only when a workflow/router points to them.

## 6. Code index data (`memory/codebase/`)

Rebuildable cache, **git-ignored**: `index.sqlite` (sqlite-vec), `graph.json`. The committed
`README.md` there is the access protocol. Never the source of truth — if it disagrees with
the code or with `memory/project`, the code/markdown wins and the index is stale.

## 7. Project-Specific Conventions (DocsOb)

- **Directory Structure:**
  - `docs/`: Product Requirements Document (`PRD.md`) and System Architecture Specification (`ARCHITECTURE.md`).
  - `wireframes/perspective_dashboard/`: Interactive HTML5/CSS3 prototype pages (`index.html`, `documentos.html`, `detalhes-documento.html`, `calendario.html`, `notificacoes.html`, `usuarios.html`, `configuracoes.html`, `auditoria.html`, `perfil.html`, `styles.css`).
- **HTML Table Cell Alignment Rule:** Flex container classes (e.g. `.doc-name-cell`, `.due-date-cell`, `.responsible-cell`, `.table-actions-cell`) must be placed inside inner `<div>` wrapper elements within `<td>` cells, never directly on `<td>` elements, to preserve `display: table-cell` grid alignment.
- **Design System Tokens:** CSS custom properties driven by Midnight Navy palette (`--bg-main: #021024`, `--bg-card: #052659`, `--primary: #5483B3`, `--primary-light: #C1E8FF`, `--primary-border: #7DA0CA`).
- **Applicable Workflows:** `feature.md`, `bugfix.md`, `planning.md`, `quick.md`.

## 8. The golden rule

> If you can name it well, you don't need a database. Markdown is the brain; folders are the
> index; the vec index is only a fast lookup over **code**.
