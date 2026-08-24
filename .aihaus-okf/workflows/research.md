# Workflow — research

> Use when: you need **evidence or exploration before a decision** — "how should we build X", "what
> are the rules/options for Y", a vendor/landscape scan, or open-ended ideation. It produces a
> **decision-ready, cited synthesis**, never code and never a branch. If the *what* is already clear
> and you just need an execution plan, go straight to `planning.md`.

_Last updated: 2026-06-23_

## How a lane works

Stages run **top to bottom**. Each names the **agent role**, what it **reads / produces** under
`memory/`, and its **exit gate**. A gate is a **verdict, not prose** — one of
`PASS · FAIL · SKIPPED · BLOCKED · BLOCKED-TO-PLANNING`. Only `PASS` (or a justified `SKIPPED`)
advances. Every external claim carries a provenance tag: **VERIFIED · CITED · ASSUMED**.

The **task is one file** in `memory/kanban/`. Research moves it `todo → doing → review`; on a clean
synthesis it lands in `done` (read-only output) or routes onward to `planning.md`.

---

## Stages

### 1. Scope the question — `orchestrator`
- **Reads:** the request (task `## Goal`, or a fresh `new-task`).
- **Produces:** the exact question, the decision it informs, and whether the answer could affect a
  business rule — written into the task `## Context`.
- **Board:** ensure a task file exists; keep it in `todo`/`doing`.
- **Exit gate `PASS`:** the question and the decision-at-stake are unambiguous. Too vague → ask one
  clarifying question and re-enter.

### 2. Internal context — `researcher`
- **Reads:** `memory/project/` (rules, decisions, knowledge); the code index for relevant nodes.
- **Produces:** relevant prior decisions, gotchas, and code analogs (`path:line`) in `## Context`.
- **Board:** move the task `todo → doing`.
- **Exit gate `PASS` / `SKIPPED`:** internal evidence is gathered, or `SKIPPED` with
  `no-internal-context` recorded.
> 🔍 codebase: query

### 3. External research — `researcher` *(conditional)*
- **Reads:** the scoped question; internal context.
- **Produces:** external evidence when the answer depends on current facts; **every claim labelled
  VERIFIED / CITED / ASSUMED with its source** — written to the task `## Context` or a linked note.
- **Exit gate `PASS` / `SKIPPED`:** claims are cited, or `SKIPPED` with `no-external-research-needed`.

### 4. Challenge the findings — `reviewer`
- **Reads:** the internal + external evidence.
- **Produces:** an adversarial verdict in `## Log` — weak sources, missing alternatives, hidden
  assumptions, and any impact on business rules.
- **Board:** move the task `doing → review`.
- **Exit gate `PASS`:** source quality and alternatives hold up. If the question turns out to hinge
  on an undefined business rule → `BLOCKED-TO-PLANNING` (hand to `planning.md`).

### 5. Synthesize the decision package — `orchestrator`
- **Reads:** scope, context, external evidence, and challenges — reconciled.
- **Produces:** a decision-ready summary in the task body (recommendation, rule implications, risks,
  unresolved questions, suggested next lane). Promote durable, reusable facts to
  `memory/project/knowledge.md` (or a `decisions.md` entry if a decision was settled) via
  `promote-memory`.
- **Board:** move the task `review → done` if the output is the deliverable, or back to `todo` of
  the next lane (e.g. `planning`) if it kicks off build work.
- **Exit gate `PASS`:** a cited, decision-ready synthesis exists with explicit open questions; every
  external claim is tagged.
