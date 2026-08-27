---
type: procedure
owner: engineering
status: active
last_reviewed: 2026-08-27
---

# Procedures — How-Tos & Runbooks

> Standard procedures for working in the DocsOb codebase.

## Current truth

### 1. Codebase Scan & Status
Check the codebase index status or project structure:
```bash
node .aihaus-okf/tools/index.mjs status
node .aihaus-okf/tools/scan.mjs --json
```

### 2. Previewing the Wireframe Prototype
Open `wireframes/perspective_dashboard/index.html` in any web browser to view and interact with the DocsOb prototype.

### 3. Linear Task Management (Orca CLI)
- View current ticket details: `orca linear issue --current --full --json`
- Update issue status: `orca linear status set <ISSUE-ID> --to "<STATUS>" --json`
- Post comment: `orca linear comment add <ISSUE-ID> --body "<COMMENT>" --json`
- Attach URL: `orca linear attach <ISSUE-ID> --url "<URL>" --title "<TITLE>" --json`

### 4. Code Indexing (aihaus-okf)
Build or query the codebase index:
```bash
node .aihaus-okf/tools/index.mjs status
node .aihaus-okf/tools/index.mjs build
```

### 5. Multi-Agent Development Pipeline (Orca CLI)
Standard operational flow for development tasks across specialized agents:
1. **Planner (Antigravity)**: Receives context-rich prompt and drafts technical architecture and execution steps.
2. **Reviewer (ChatGPT / Codex)**: Performs adversarial audit against PRD/Architecture/API contracts, resolves gaps, and generates the validated implementation prompt.
3. **Implementer (Antigravity)**: Executes code changes inside owned files matching the prompt.
4. **QA (ChatGPT / Codex)**: Authors automated test suites (Vitest / React Testing Library / Supertest).
5. **Orchestrator**: Executes validation (`npm test`), manages Kanban state (`doing -> done`), and delivers completion summary.

## Details

- Multi-agent sessions are managed as dedicated worktrees via Orca CLI (`orca worktree create --name <agent-name> --agent <agent-type>`).
- Prototype files in `frontend/` serve as visual reference for the React + TypeScript SPA.

## Open questions

- End-to-End (E2E) testing framework setup (Playwright) for frontend CI/CD.

## Links

- project: project.md · decisions: decisions.md · environment: environment.md

## Timeline

- 2026-08-27 — Added Procedure 5 for the 4-agent development pipeline (Planner, Reviewer, Implementer, QA).
- 2026-08-24 — Documented prototype preview, Linear CLI procedures, and code indexing commands.
- 2026-06-23 — Seeded from the aihaus-okf project template.
