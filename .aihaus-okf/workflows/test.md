# Workflow — test

> Use when: **the work itself is tests** — raising coverage on existing code, hardening or repairing
> a brittle/flaky suite, adding characterization tests before a refactor, or building a missing test
> harness. The code under test already exists; you are not changing its behaviour. If you are adding
> *new* behaviour, use `feature.md` (it does tests-first for new code); if a *defect* is in play, use
> `bugfix.md` (it owns the regression test). This lane touches **test code, not product code**.

_Last updated: 2026-06-23_

## How a lane works

Stages run **top to bottom**. Each names the **agent role**, what it **reads / produces** under
`memory/`, and its **exit gate**. A gate is a **verdict, not prose** — one of
`PASS · FAIL · SKIPPED · BLOCKED · BLOCKED-TO-PLANNING`. Only `PASS` (or a justified `SKIPPED`)
advances. `FAIL` loops to the named stage; `BLOCKED` stops on an operational dependency;
`BLOCKED-TO-PLANNING` returns the task to `planning.md` when the *expected* behaviour a test should
assert is a missing or conflicting rule — its answer becomes a new entry in
`memory/project/business-rules.md`.

The **task is one file** in `memory/kanban/`; its **status is its folder**. This lane moves it
`todo → doing → review → done`. Code-context stages are marked `> 🔍 codebase: …`.

---

## Stages

### 1. Scope the testing goal — `orchestrator`
- **Reads:** the task file in `memory/kanban/todo/`; `memory/project/project.md`,
  `business-rules.md`, `decisions.md`.
- **Produces:** the testing target written into the task `## Goal` / `## Context` — *which behaviour
  or surface* is being covered, the kind of work (coverage / flake-repair / characterization /
  harness), and what "done" means as a measurable bar (a coverage delta, a green-N-times flake bar,
  a named behaviour set, or a runnable harness). No product-behaviour change is in scope.
- **Board:** ensure a task exists; move it `todo → doing`.
- **Exit gate `PASS`:** the target and the "done" bar are unambiguous and testable. If the behaviour
  a test must assert depends on an undefined rule → `BLOCKED-TO-PLANNING`.

### 2. Map code-under-test + existing tests — `researcher`
- **Reads:** the scoped goal; `memory/project/knowledge.md` (test gotchas), `environment.md`.
- **Produces:** the code under test and its callers/blast radius, plus the **current tests** that
  already cover it and where the gaps or flakes live — all as `path:line` pointers in `## Context`.
- **Exit gate `PASS`:** the surface under test, its call sites, and the existing test footprint are
  located. `SKIPPED` only with `no-existing-tests` recorded (e.g. a greenfield harness).
> 🔍 codebase: query

### 3. Plan the test cases — `planner`
- **Reads:** the mapped surface and existing tests; the rules from stage 1.
- **Produces:** the task `## Checklist` — an enumerated case list (happy path, **edge and negative**
  cases, error paths), each case **tied to a rule or acceptance criterion**; the owned test-file set
  (no two slices write the same file); for flake work, the suspected sources of nondeterminism to
  pin down.
- **Exit gate `PASS`:** every planned case names what it asserts and the rule/criterion it backs;
  scope is bounded. If a case has no rule to assert → `BLOCKED-TO-PLANNING`.
> 🔍 codebase: query

### 4. Write / repair the tests — `implementer`
- **Reads:** the case checklist; the existing tests; pinned decisions (do not contradict an ADR).
- **Produces:** the tests, inside the owned test-file scope only — each asserts real behaviour and
  names the case/rule it covers in `## Log`. For flake repair: identify the **root nondeterminism**
  (time, ordering, shared state, network) and stabilise it (control the clock/seed, isolate state),
  not paper over it with retries or sleeps. Product code is **not** edited; if a case can only pass
  by changing product behaviour, stop and route to `feature.md`/`bugfix.md`.
- **Exit gate `PASS`:** the planned cases are authored (and characterization tests pin current
  behaviour); each cites the rule/case it covers.
> 🔍 codebase: query

### 5. Run + measure — `verifier`
- **Reads:** the new/repaired tests and the goal's "done" bar.
- **Produces:** captured commands, exit codes, the coverage delta, and — for flake work — a
  **repeated-run** result (green N times) in `## Log`. Evidence is *ran*, not asserted.
- **Exit gate `PASS`:** the suite runs green and the measured bar from stage 1 is met (coverage
  target hit, flake no longer reproduces over N runs). `FAIL` → back to stage 4.

### 6. Review test quality — `reviewer`
- **Reads:** the tests, the case plan, and the run evidence. Pulls callers / blast radius.
- **Produces:** a review verdict in `## Log` — confirms the tests **assert real behaviour** (not
  tautologies or restated implementation), are **deterministic** (no hidden ordering/time/state
  coupling), and are **named clearly** for the case they cover. Flags any test that would stay green
  if the code under test broke.
- **Board:** move the task `doing → review`.
- **Exit gate `PASS`:** no unaddressed CRITICAL/HIGH finding (a tautological or flaky test is a
  finding). `FAIL` → fix loop at stage 4 (cap at 2 passes, then escalate).
> 🔍 codebase: query

### 7. Land + update index — `orchestrator`
- **Reads:** the reviewed, green test set.
- **Produces:** the commit (test files only); any durable testing **convention or gotcha** promoted
  to `memory/project/knowledge.md` (or `procedures.md` for a repeatable test runbook) via the
  `promote-memory` skill — only genuinely reusable facts, not case-specific detail. Then dispatch the
  `implementer` to refresh the code index via the `map-codebase` skill so later tasks see the new
  tests.
- **Board:** move the task `review → done`.
- **Exit gate `PASS`:** tests committed, index refreshed, and the durable convention is promoted
  **or** a `no-durable-memory` note is recorded.
> 🔍 codebase: update
