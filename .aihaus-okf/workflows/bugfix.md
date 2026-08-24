# Workflow — bugfix

> Use when: **existing behaviour is broken** — a defect, error, or regression. The work is grounded
> in *reproduction first*, then root cause, then a fix that is covered by a regression test. If the
> behaviour was never built, use `feature.md`; if the *expected* behaviour is itself unclear, route
> to `planning.md`.

_Last updated: 2026-06-23_

## How a lane works

Stages run **top to bottom**. Each names the **agent role**, what it **reads / produces** under
`memory/`, and its **exit gate**. A gate is a **verdict, not prose** — one of
`PASS · FAIL · SKIPPED · BLOCKED · BLOCKED-TO-PLANNING`. Only `PASS` (or a justified `SKIPPED`)
advances. `FAIL` loops to the named stage; `BLOCKED` stops on an operational dependency;
`BLOCKED-TO-PLANNING` returns the task to `planning.md` when the *correct* behaviour is a missing
or conflicting rule — its answer becomes a new entry in `memory/project/business-rules.md`.

The **task is one file** in `memory/kanban/`; its **status is its folder**. This lane moves it
`todo → doing → review → done`.

---

## Stages

### 1. Triage + reproduce — `researcher`
- **Reads:** the task file in `memory/kanban/todo/`; `memory/project/knowledge.md` (known gotchas),
  `project.md`, `decisions.md`.
- **Produces:** reproduction evidence, 2-3 root-cause hypotheses tested down to the actual cause,
  and the affected files (`path:line`) — written into the task `## Context`.
- **Board:** move the task `todo → doing`.
- **Exit gate `PASS`:** the bug reproduces and the root cause is identified with evidence (not a
  guess). If it cannot be reproduced, record the blocker → `BLOCKED`.
> 🔍 codebase: query

### 2. Rule impact — `planner`
- **Reads:** the triage; `memory/project/business-rules.md`.
- **Produces:** which accepted rule the bug violates — or a note that the "correct" behaviour is a
  gap/conflict — in `## Context`.
- **Exit gate `PASS`:** the violated rule is named (the fix has a target to restore). If the
  expected behaviour is genuinely undefined → `BLOCKED-TO-PLANNING`.

### 3. Failing regression test — `implementer`
- **Reads:** the root cause and the violated rule.
- **Produces:** a test that reproduces the bug and fails for the right reason; note in `## Log`.
- **Exit gate `PASS`:** the regression test fails on the broken code. `SKIPPED` only with a written
  waiver reason (e.g. non-code / config-only) in `## Log`.

### 4. Fix the root cause — `implementer`
- **Reads:** the triage, the violated rule, the failing test; pinned ADRs.
- **Produces:** a fix that addresses the **root cause, not the symptom**, inside an owned-file
  scope; the cited rule stays satisfied. Note in `## Log`.
- **Exit gate `PASS`:** the change is applied and aligned to the cited rule.
> 🔍 codebase: query

### 5. Verify — `verifier`
- **Reads:** the regression test and the fix.
- **Produces:** evidence the regression now passes **and** nearby behaviour did not regress —
  commands, exit codes, artifact paths in `## Log`.
- **Exit gate `PASS`:** regression green + no new failures, evidence is *ran*. `FAIL` → stage 4
  (cap re-diagnosis at ~3 cycles before escalating).

### 6. Adversarial review — `reviewer`
- **Reads:** the triage, the fix, the verification. Pulls callers / blast radius.
- **Produces:** an independent verdict in `## Log` — re-checks the fix against the cited criteria,
  hunts incomplete root cause / hidden callers / new risk / needless complexity, and **runs the
  affected tests itself**, separating new regressions from pre-existing test debt.
- **Board:** move the task `doing → review`.
- **Exit gate `PASS`:** no unaddressed CRITICAL/HIGH finding; a "passes" claim is backed by a *ran*
  rung. `FAIL` → stage 4.
> 🔍 codebase: query

### 7. Land + promote — `orchestrator`
- **Reads:** the verified fix.
- **Produces:** an atomic commit (only the changed files); durable root-cause lessons and gotchas
  promoted to `memory/project/knowledge.md` (and a `decisions.md` entry if a non-obvious choice was
  made) via the `promote-memory` skill. Then dispatch the `implementer` to refresh the code index
  via the `map-codebase` skill.
- **Board:** move the task `review → done`.
- **Exit gate `PASS`:** fix committed, index refreshed, and the lesson is promoted **or** a
  `no-durable-memory` note is recorded.
> 🔍 codebase: update
