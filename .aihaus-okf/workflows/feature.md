# Workflow — feature

> Use when: building a **new, scoped capability** that fits one working session. The behaviour is
> understood (or planned) and you are ready to change code. If the *what* is unclear, run
> `planning.md` first; if existing behaviour is broken, run `bugfix.md`.

_Last updated: 2026-06-23_

## How a lane works

Stages run **top to bottom**. Each stage names the **agent role** that runs it, what it
**reads / produces** under `memory/`, and its **exit gate**. A gate is a **verdict, not prose** —
one of `PASS · FAIL · SKIPPED · BLOCKED · BLOCKED-TO-PLANNING`. Only `PASS` (or a justified
`SKIPPED`) advances the lane. `FAIL` loops back to the named stage; `BLOCKED` stops for an
operational dependency; `BLOCKED-TO-PLANNING` returns the task to `planning.md` because a
business-visible rule is missing or in conflict — that answer becomes a new entry in
`memory/project/business-rules.md`.

The **task is one file** in `memory/kanban/`; its **status is its folder**. This lane moves it
`todo → doing → review → done`. Code-touching stages are marked `> 🔍 codebase: …`.

---

## Stages

### 1. Map context — `planner`
- **Reads:** the task file in `memory/kanban/todo/`; `memory/project/project.md`,
  `business-rules.md`, `decisions.md`, `knowledge.md`.
- **Produces:** a tight context packet appended to the task `## Context` (memory pointers,
  affected files as `path:line`, the rules each behaviour must honour).
- **Board:** move the task `todo → doing`.
- **Exit gate `PASS`:** the ask is understood, the relevant rules/decisions are pinned, and there
  is no open question about *what* "done" means. If a rule is missing → `BLOCKED-TO-PLANNING`.
> 🔍 codebase: query

### 2. Plan the slices — `planner`
- **Reads:** the context packet from stage 1; codebase query results.
- **Produces:** the task `## Checklist` — owned-file slices (no two slices write the same file),
  files to create, the verification strategy (which tests/checks), and likely integration points.
- **Exit gate `PASS`:** every checklist item names files and a check; scope is bounded (if it
  sprawls past ~10 files or >3 independent stories, note it and suggest re-running `planning.md`).
> 🔍 codebase: query

### 3. Tests first — `implementer`
- **Reads:** the checklist and the acceptance criteria (the rules from stage 1).
- **Produces:** a failing test (or an explicit written verification contract) for each acceptance
  criterion; a note in `## Log`.
- **Exit gate `PASS`:** tests fail for the expected reason. `SKIPPED` is valid **only** with a
  written non-code / mechanics reason recorded in `## Log`.

### 4. Implement — `implementer`
- **Reads:** the checklist; the failing tests; pinned decisions (do not contradict an ADR).
- **Produces:** the code change, inside the owned-file scope only; each behaviour change cites the
  rule id it satisfies in `## Log`. Widening scope returns to stage 2, not silent expansion.
- **Exit gate `PASS`:** the change is complete and claims the acceptance criteria it satisfies.
> 🔍 codebase: query

### 5. Local verification — `verifier`
- **Reads:** the tests and the change.
- **Produces:** captured commands, exit codes, and any skipped-check reasons in `## Log`.
- **Exit gate `PASS`:** the relevant tests, type checks, and build run green — evidence is
  *ran*, not asserted. `FAIL` → back to stage 4.

### 6. Review — `reviewer`
- **Reads:** the diff, the context packet, the verification log. Pulls callers / blast radius.
- **Produces:** a review verdict in `## Log` — actionable findings or a written "nothing found"
  rationale. Keeps complexity findings separate from correctness/security/integration findings.
- **Board:** move the task `doing → review`.
- **Exit gate `PASS`:** no unaddressed CRITICAL/HIGH finding. `FAIL` → fix loop at stage 4
  (cap the loop; if it won't settle in 2 passes, stop and escalate).
> 🔍 codebase: query

### 7. Final verification — `verifier`
- **Reads:** every accepted criterion plus the review outcome. Prefer a fresh pass, ideally a
  different model than implementation did.
- **Produces:** a per-criterion verdict with evidence in `## Log`.
- **Exit gate `PASS`:** every accepted criterion is verified with attached evidence. Any
  PASS-WITH-GAPS or FAIL flags the task for human review before it advances.

### 8. Land + promote — `orchestrator`
- **Reads:** the finished, verified change.
- **Produces:** the commit; durable learnings promoted to `memory/project/` (a rule, a decision in
  `decisions.md`, a gotcha in `knowledge.md`) via the `promote-memory` skill — only genuinely
  reusable facts, not change-specific detail. Then dispatch the `implementer` to refresh the code
  index via the `map-codebase` skill so later tasks see the change.
- **Board:** move the task `review → done`.
- **Exit gate `PASS`:** change committed, index refreshed, and durable memory is promoted **or** a
  `no-durable-memory` note is recorded.
> 🔍 codebase: update
