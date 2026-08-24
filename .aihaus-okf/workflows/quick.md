# Workflow — quick

> Use when: a **small, low-risk, mechanically scoped** change — covered by an existing rule or
> purely mechanical, **≤3 files**, and **not** touching production, secrets, auth, payments, schema
> migrations, or any destructive command. It keeps rule-awareness and verification but skips the
> full feature swarm. The moment scope widens or risk appears, **escalate** — don't push through.

_Last updated: 2026-06-23_

## How a lane works

Stages run **top to bottom**. Each names the **agent role**, what it **reads / produces** under
`memory/`, and its **exit gate** — a **verdict, not prose** (`PASS · FAIL · SKIPPED · BLOCKED ·
BLOCKED-TO-PLANNING`). Higher-risk intent always wins: if eligibility fails, the lane stops and
escalates to `planning.md` (or `feature.md`/`bugfix.md`) rather than bending the rules.

The **task is one file** in `memory/kanban/`; this lane moves it `todo → doing → review → done`.

---

## Stages

### 1. Eligibility check — `orchestrator`
- **Reads:** the request (task `## Goal`); `memory/project/business-rules.md` to confirm coverage.
- **Produces:** a short eligibility note in `## Context` — confirms the change is covered by an
  existing rule or is purely mechanical, names the ≤3 owned files, and confirms it avoids
  production / secrets / auth / payments / schema migrations / destructive commands.
- **Board:** create the task via `new-task` if needed; move `todo → doing`.
- **Exit gate `PASS`:** all eligibility conditions hold. Any failure → `BLOCKED-TO-PLANNING`:
  escalate to `planning.md` (or the right implementation lane). Do not proceed.

### 2. Apply the scoped change — `implementer`
- **Reads:** the eligibility note; pinned ADRs.
- **Produces:** the smallest change inside the owned-file set; a note in `## Log`.
- **Exit gate `PASS`:** the change stays within the ≤3 owned files. If it starts to widen scope,
  stop → `BLOCKED-TO-PLANNING` and escalate.
> 🔍 codebase: query

### 3. Verify — `verifier`
- **Reads:** the change.
- **Produces:** the narrowest relevant check (test / build / smoke) with command, exit code, and
  evidence in `## Log`.
- **Exit gate `PASS`:** the relevant check runs green — evidence is *ran*. `FAIL` → stage 2.

### 4. Focused review — `reviewer`
- **Reads:** the diff of the changed files only.
- **Produces:** a verdict in `## Log` — correctness risk and needless complexity on the changed
  files. If a broader blast radius surfaces, say so.
- **Board:** move the task `doing → review`.
- **Exit gate `PASS`:** no unaddressed CRITICAL/HIGH finding. A wider blast radius →
  `BLOCKED-TO-PLANNING` (escalate to `feature.md`).
> 🔍 codebase: query

### 5. Land + promote — `orchestrator`
- **Reads:** the reviewed change.
- **Produces:** an atomic commit; dispatch the `implementer` to refresh the code index via the
  `map-codebase` skill. Promote durable memory **only if** the
  run produced a reusable rule / decision / gotcha (via `promote-memory`); otherwise record a
  `no-durable-memory` note.
- **Board:** move the task `review → done`.
- **Exit gate `PASS`:** change committed, index refreshed, memory promoted or `no-signal` recorded.
> 🔍 codebase: update
