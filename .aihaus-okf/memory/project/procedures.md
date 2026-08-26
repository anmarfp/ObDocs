---
type: procedure
owner: engineering
status: active
last_reviewed: 2026-08-24
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

## Details

- Prototype files are vanilla HTML/CSS/JS and require no build step.

## Open questions

- Test suite runner command (to be established upon backend API setup).

## Links

- project: project.md · environment: environment.md

## Timeline

- 2026-08-24 — Documented prototype preview, Linear CLI procedures, and code indexing commands.
- 2026-06-23 — Seeded from the aihaus-okf project template.
