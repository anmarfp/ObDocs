---
type: knowledge
owner: architecture
status: active
last_reviewed: 2026-08-29
---

# Knowledge — DocsOb

> Durable facts, architectural conventions, and technical gotchas.

## Current truth

- **HTML Table Rule in Prototypes:** Flex container utility classes (`display: flex`) must NEVER be applied directly to `<td>` tags, as doing so breaks standard table cell rendering layout (`display: table-cell`) and misaligns column headers across `<thead>` and `<tbody>`. Flex layout must always be applied to an inner `<div>` wrapper placed inside the `<td>`.
- **Status Calculation Logic (RN-001):**
  - ⚪ `INDETERMINATE`: `expiration_date` is NULL or category is "Sem Vencimento".
  - 🔵 `RENEWAL_IN_PROGRESS`: Manual status is "Em Renovação".
  - 🔴 `EXPIRED`: Current Date > `expiration_date`.
  - 🟡 `CRITICAL`: (`expiration_date` - Current Date) <= `alert_lead_days`.
  - 🟢 `REGULAR`: Current Date < `expiration_date` and outside lead days.
- **Context-Rich Prompting for Specialist Agents (Planner/Implementer/Reviewer):** When creating agent sessions via Orca CLI, the initial prompt must be exhaustive and structured: provide the project domain (DocsOb), full business rules (RN-001 to RN-009), exact file/schema references (`backend/prisma/schema.prisma`, `backend/src/routes/*`, `frontend/styles.css`), technical constraints (strict TS, 10MB limits, RBAC) and clear verification checkpoints.
- **`main` is the de facto integration branch; there is no CI/CD pipeline yet.** No `.github/workflows/` exists — "post-merge pipeline" is currently just `npm run test:all` run locally. `git remote` only has `origin/main` (plus stale `origin/Criar-o-protótipo-da-UI`) — no `develop`/`staging` branch was ever created.
- **Gotcha — dirty Orca worktrees are not automatically unmerged work.** The 4 reusable pipeline worktrees (`anmarfp/planner-frontend`, `anmarfp/reviewer-codex`, `anmarfp/implementer-antigravity`, `anmarfp/qa-codex`) were never merged into `main` via PR/merge commit — a prior orchestrator run applied the vetted final diffs **directly onto `main`** as regular commits (Phase 3/4: `62b05f8`, `7682cd2`, `f74c83f`, `d13cb43`, `b0463ea`), leaving those branches behind `main` (0 unique commits each) with stale uncommitted working-tree changes from mid-pipeline. Verified 2026-08-29: `git -C <worktree> rev-list --left-right --count main...HEAD` showed `N 0` for all four (zero unique commits), and a full per-file diff of every `M`/`??` path against `main`'s current content showed the deltas were either byte-identical or strictly older/superseded snapshots (e.g. `implementer-antigravity`'s `docker-compose.yml` still used `localhost` health-checks that `main` later fixed to `127.0.0.1`). **Before treating a worktree's dirty status as pending work to merge, diff every changed file's content against `main`, not just `git status`.**

## Details

- **Linear Integration:** Issue tracking is connected via Orca CLI (`orca linear ...`). Tasks are tracked on team `DOC`.
- **UI Design System Variables:**
  - `--bg-main: #021024` (Midnight Dark Navy)
  - `--bg-card: #052659` (Deep Navy)
  - `--primary: #5483B3` (Slate Blue)
  - `--primary-border: #7DA0CA` (Soft Muted Blue)
  - `--primary-light: #C1E8FF` (Ice Light Blue)

## Open questions

- Verification strategy for daily status cron recalculation in production.

## Links

- docs/ARCHITECTURE.md:247
- docs/PRD.md:60

## Timeline

- 2026-08-29 — Ran a full orchestration status check ("Ponytail" sweep): confirmed all 4 reusable Orca worktrees carry zero unique commits and zero unique content vs. `main` (everything already landed via direct commits); documented the dirty-worktree gotcha and the no-CI-yet / `main`-is-integration-branch facts so future runs skip re-deriving this.
- 2026-08-24 — Added HTML table layout rule and status calculation matrix.
- 2026-06-23 — Seeded from the aihaus-okf project template.
