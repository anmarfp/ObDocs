---
type: project
owner: project
status: active
last_reviewed: 2026-08-29
---

# Project — DocsOb

> Document Expiration & Renewal Management System (Gestão de Vencimento de Documentos).

## Current truth

DocsOb is a web application designed to proactively track document expiration dates (contracts, licenses, tax certificates, insurance policies, worker obligations) via color-coded status matrices, automated email alerts, Google Calendar synchronization, role-based access control (RBAC), and an immutable audit log. All 4 phases are complete and the system is marked "Concluído / Em Produção" in the PRD: Phase 1 PRD (`docs/PRD.md`), Phase 2 Architecture Specification (`docs/ARCHITECTURE.md`) and documents module, Phase 3 React/TypeScript frontend (dashboard, reports, calendar, audit, users, settings) plus the fully tested Node.js/TypeScript RESTful API backend (`backend/`), and Phase 4 full-stack integration with a unified `docker-compose.yml`, unified run/test scripts, and E2E tests (`scripts/run-e2e.mjs`).

## Details

- **Stack:** Node.js (TypeScript, ES Modules), Express, Prisma ORM, PostgreSQL, Vitest, Multer, Zod, JWT, Bcrypt. Frontend: React + TypeScript + Vite + Tailwind. Legacy static UI prototype remains at `wireframes/perspective_dashboard/`.
- **Architecture:** Client-Server / RESTful API architecture, now containerized end-to-end via root `docker-compose.yml` (`npm run docker:up`).
- **Conventions:** Flex container layout classes must be placed on inner `<div>` elements inside `<td>` cells to preserve HTML table column alignment.

## Open questions

- None open at this time — the Phase 3 prototype/API integration question was resolved by the Phase 4 full-stack integration.

## Links

- PRD: [docs/PRD.md](file:///C:/Users/Marco/Documents/ObDocs/docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](file:///C:/Users/Marco/Documents/ObDocs/docs/ARCHITECTURE.md)
- UI Prototype (legacy): [wireframes/perspective_dashboard/index.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/index.html)
- rules: business-rules.md · decisions: decisions.md · environment: environment.md

## Timeline

- 2026-08-29 — Verified Phase 4 completion end to end: `main` clean and up to date with origin; commits `f74c83f`/`d13cb43`/`b0463ea` (2026-08-27) deliver full-stack integration, unified Docker Compose, and E2E scripts, with PRD/ARCHITECTURE updated to "Fases 1 a 4 Concluídas"; backend Vitest suite re-run and confirmed 140/140 passing; kanban board has all 15 tasks in `done/` with none pending. Corrects this page, which had been stale since 2026-08-24 (stuck describing Phase 3 as current).
- 2026-08-26 — Completed Phase 3 Backend implementation (Passo 1 to Passo 9) with 140/140 automated Vitest tests covering Auth, Documents, Admin, Renewals, Audit, Notifications, Cron, Calendar, Dashboard, and Reports.
- 2026-08-24 — Personalized aihaus-okf engine with real repository evidence from PRD v0.2.0 and Architecture v1.0.0.
- 2026-06-23 — Seeded from the aihaus-okf project template.

