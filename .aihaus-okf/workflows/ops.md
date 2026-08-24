# Workflow — ops

> Use when: the work crosses an **environment boundary** — deploy, release, homologation/staging,
> rollback, or any production-readiness action. This lane is **policy-gated**: it classifies the
> boundary, requires a human-approval gate before anything risky, and prepares an execution plan.
> It does **not** silently run production commands. Safety still depends on external containment and
> least-privilege credentials — this lane gates its own steps, it is not a general permission system.

_Last updated: 2026-06-23_

## How a lane works

Stages run **top to bottom**. Each names the **agent role**, what it **reads / produces** under
`memory/`, and its **exit gate** — a **verdict, not prose** (`PASS · FAIL · SKIPPED · BLOCKED ·
HUMAN-REVIEW-REQUIRED`). Production-touching stages stop on `HUMAN-REVIEW-REQUIRED` until a person
approves; an operational dependency stops on `BLOCKED`. Higher-risk routes always win.

The **task is one file** in `memory/kanban/`; this lane moves it `todo → doing → review` and holds
at `review` until human approval lands, then `done`. Release/deploy specifics live durably in
`memory/project/deployment.md`.

---

## Stages

### 1. Classify the boundary — `orchestrator`
- **Reads:** the objective (task `## Goal`); `memory/project/deployment.md`, `environment.md`.
- **Produces:** the boundary classification in `## Context` — local · CI · staging/homolog ·
  production · destructive · secret-touching · read-only observation.
- **Board:** create the task via `new-task` if needed; move `todo → doing`.
- **Exit gate `PASS`:** the boundary and the blast radius are named.

### 2. Policy gate — `reviewer`
- **Reads:** the classification; `memory/project/business-rules.md` and `deployment.md` for release
  policy, rollback readiness, and credential scope.
- **Produces:** a policy verdict in `## Log` — is this action allowed, or does it need human
  sign-off? Checks containment, least-privilege credentials, and rollback readiness.
- **Exit gate:** `PASS` (`ALLOW`) advances; **`HUMAN-REVIEW-REQUIRED`** stops for human approval;
  `BLOCKED` stops on a missing dependency. A read-only observation may `PASS` straight through.

### 3. Prepare the execution plan — `implementer`
- **Reads:** the classification and the policy verdict; `memory/project/procedures.md` (existing
  runbooks) and `deployment.md`.
- **Produces:** an ops plan in the task body — exact commands, prechecks, smoke checks, rollback
  steps, expected evidence, and stop conditions. **Does not execute production commands here.**
- **Exit gate `PASS`:** a complete, reviewable plan with a rollback path exists. `FAIL` → stage 2.

### 4. Homologation review — `verifier` *(conditional)*
- **Reads:** the plan; the target environment.
- **Produces:** for staging/homolog targets touching UI or user flows, browser/headless evidence in
  `## Log`. Backend-only changes record an explicit skip reason.
- **Exit gate `PASS` / `SKIPPED`:** UI/flow behaviour has evidence, or a justified
  `not-homolog-or-no-ui-flow` skip is recorded.

### 5. Human approval — `orchestrator`
- **Reads:** the plan, the policy verdict, and homolog evidence.
- **Produces:** a tight approval package in the task body — business result, evidence, risk,
  rollback, and the exact approval being requested.
- **Board:** move the task `doing → review`; it **holds** here until a person approves.
- **Exit gate `HUMAN-REVIEW-REQUIRED`:** stop for the human decision. On approval, the action may
  proceed under external containment; the outcome (promotion evidence + rollback notes) is recorded
  to `memory/project/deployment.md` (via `promote-memory`) and the task moves `review → done`.
