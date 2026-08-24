# Workflow — planning

> Use when: the **what** is not yet pinned — you need to clarify business rules, acceptance
> criteria, scope, and risk **before** anyone touches code. The lane is business-first: it produces
> an **accepted plan** (a testable contract) or a **focused business-rule blocker**, never code.
> Output feeds `feature.md` (small) or a multi-task split (large). Exploratory / open-ended
> ideation belongs in `research.md` first.

_Last updated: 2026-06-23_

## How a lane works

Stages run **top to bottom**. Each names the **agent role**, what it **reads / produces** under
`memory/`, and its **exit gate**. A gate is a **verdict, not prose** — one of
`PASS · FAIL · SKIPPED · BLOCKED · BLOCKED-TO-PLANNING`. Only `PASS` (or a justified `SKIPPED`)
advances. A business-rule gap returns to the user as **one focused question in business language**;
its answer is promoted by the `orchestrator` (via `promote-memory`) into
`memory/project/business-rules.md` and *that* unblocks the lane.

The **task is one file** in `memory/kanban/`. Planning operates on it in `todo`/`doing` and leaves
it **ready for an implementation lane** (it does not reach `done` here — building does).

---

## Stages

### 1. Intake + route — `orchestrator`
- **Reads:** the request (from the task `## Goal`, or a fresh `new-task`).
- **Produces:** a one-line classification — is this really planning, or should it route to
  `feature` / `bugfix` / `research` / `quick` / `ops`? Records the chosen lane in the task
  frontmatter `workflow:` field.
- **Board:** ensure a task file exists (create via `new-task` if not); keep it in `todo`/`doing`.
- **Exit gate `PASS`:** the request has workflow value and planning is the right lane. If a trivial
  answer suffices, route to `quick.md` or answer inline instead.

### 2. Build the context packet — `planner`
- **Reads:** `memory/project/project.md`, `business-rules.md`, `decisions.md`, `knowledge.md`;
  analogous code patterns.
- **Produces:** the smallest useful context packet in the task `## Context` — relevant rules,
  prior decisions, and concrete codebase analogs (`path:line`).
- **Board:** move the task `todo → doing`.
- **Exit gate `PASS`:** referenced memory, files, and patterns are listed and relevant.
> 🔍 codebase: query

### 3. Requirements + scenarios — `planner`
- **Reads:** the request and the context packet.
- **Produces:** business requirements, acceptance criteria, and candidate Given/When/Then scenarios
  in the task body.
- **Exit gate `PASS`:** every acceptance criterion is **testable**; no open question remains about
  *what* is being asked. `FAIL` → redraft within this stage.

### 4. Rule coverage check — `planner`
- **Reads:** the requirements; `memory/project/business-rules.md`.
- **Produces:** each business-visible decision classified as **covered · gap · conflict ·
  mechanics**. For a gap/conflict, draft the single minimum question for the user.
- **Exit gate `PASS`:** covered/mechanics decisions can proceed. A gap or conflict →
  `BLOCKED-TO-PLANNING`: the `planner` drafts the one focused question; on the user's answer the
  `orchestrator` promotes it to `business-rules.md` via `promote-memory`, and the task re-enters
  this stage.

### 5. Research the unknowns — `researcher` *(conditional)*
- **Reads:** the requirements and any rule-check gaps that depend on unknown technical/domain facts.
- **Produces:** cited evidence (label each claim VERIFIED / CITED / ASSUMED) appended to the task
  `## Context` — or `SKIPPED` with `no-external-unknowns`.
- **Exit gate `PASS` / `SKIPPED`:** decision-blocking unknowns are resolved or explicitly assumed.
> 🔍 codebase: query

### 6. Adversarial plan review — `reviewer`
- **Reads:** the requirements, rule check, and research.
- **Produces:** a challenge verdict in `## Log` — missing acceptance evidence, conflicting rules,
  risky assumptions, or over-broad scope.
- **Board:** move the task `doing → review`.
- **Exit gate `PASS`:** no unaddressed critical challenge. A surfaced rule conflict →
  `BLOCKED-TO-PLANNING` (stage 4).

### 7. Accept the plan — `orchestrator`
- **Reads:** requirements, rule check, research, and review — reconciled.
- **Produces:** the accepted plan written into the task body (problem, approach, owned-file scope,
  alternatives, risk, verification strategy, suggested next lane). Promote any durable decision to
  `memory/project/decisions.md`.
- **Board:** move the task `review → todo` of the **chosen implementation lane** (e.g. set
  `workflow: feature`), or split a large plan into linked child tasks via `new-task`. The plan is
  the durable record; the task is now ready to build.
- **Exit gate `PASS`:** an accepted, testable plan exists **or** exactly one focused business-rule
  blocker is recorded for the user.
