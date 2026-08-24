---
name: promote-memory
description: WRITE durable project memory. Propose a change to a memory/project/ page; the orchestrator approves; then apply. Agents propose, the orchestrator applies. Bump last_reviewed and add a Timeline entry.
when-to-use: When a task produces something durable — a rule learned, a decision made, a reusable finding, an environment/procedure lesson, a new term. Not for transient task notes (those stay in the kanban Log).
allowed-tools: Read, Edit, Write
---

# promote-memory — write the durable brain

Task work is not memory. When a run produces something reusable, **promote** it into
`memory/project/`. Markdown is the source of truth; this skill keeps it deliberate.

## The one rule (from aipi)
> **Agents propose. The orchestrator applies.** Shared memory pages are single-writer
> surfaces — a non-orchestrator role drafts the change and hands it up; the orchestrator
> approves and writes. Never silently rewrite the brain.

## Where each thing goes
| Durable signal | Target page |
|---|---|
| Authoritative rule / invariant | `business-rules.md` |
| Technical decision (ADR-style, newest on top) | `decisions.md` |
| Reusable finding / gotcha | `knowledge.md` |
| Stack, services, config, accounts, URLs | `environment.md` |
| Repeatable how-to / runbook | `procedures.md` |
| Release & deploy specifics | `deployment.md` |
| Domain term | `glossary.md` |
| Scope / current focus | `project.md` |

## Procedure
1. **Identify the signal.** One durable fact, with the evidence behind it (a task ref, a
   `path:line` from `query-codebase`, a review/verify finding). No vacuous entries to satisfy a gate.
2. **Pick the page** from the table. Read it first.
3. **Draft the change** in page shape:
   - **Current truth at the top** — the short version an agent should rely on. Do **not**
     bury a superseded fact in prose; mark it deprecated or move it to Timeline.
   - Exceptions/context go under `## Details`; unknowns under `## Open questions`.
   - For `decisions.md`, add a new `### YYYY-MM-DD — <title>` block, **newest first**.
4. **Propose, get approval.** A non-orchestrator role stops here and hands the draft to the
   orchestrator. The orchestrator reviews and applies.
5. **Apply** with Edit/Write:
   - Update **`## Current truth`** if the relied-on answer changed.
   - Add a **`## Timeline`** line: `- YYYY-MM-DD — what changed and why (+ evidence).`
   - **Bump `last_reviewed`** in the frontmatter to today.
6. **Mark the index stale if relevant.** Promoting code-related knowledge doesn't rebuild
   the code index — if code changed too, run `map-codebase` separately.

## Page frontmatter (must stay)
```yaml
---
type: business-rule | decision | knowledge | environment | procedure | deployment | glossary | project
owner: <role or person>
status: draft | active | deprecated
last_reviewed: YYYY-MM-DD   # bump on every promotion
---
```

## Don'ts
- Don't commit personal/global preferences or secrets into project memory.
- Don't promote run noise — if nothing was durable, record `no-signal` and move on.
- Don't edit the index (`memory/codebase/`) — it is a cache, not the brain.
