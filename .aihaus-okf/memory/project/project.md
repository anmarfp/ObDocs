---
type: project
owner: project
status: active
last_reviewed: 2026-08-24
---

# Project — DocsOb

> Document Expiration & Renewal Management System (Gestão de Vencimento de Documentos).

## Current truth

DocsOb is a web application designed to proactively track document expiration dates (contracts, licenses, tax certificates, insurance policies, worker obligations) via color-coded status matrices, automated email alerts, Google Calendar synchronization, role-based access control (RBAC), and an immutable audit log. The repository contains the Phase 1 PRD (`docs/PRD.md`), Phase 2 Architecture Specification (`docs/ARCHITECTURE.md`), the interactive UI prototype (`wireframes/perspective_dashboard/`), and the fully implemented and tested Phase 3 Node.js / TypeScript RESTful API backend (`src/`) with 100% test coverage (140 tests).

## Details

- **Stack:** Node.js (TypeScript, ES Modules), Express, Prisma ORM, PostgreSQL, Vitest, Multer, Zod, JWT, Bcrypt. Frontend: HTML5, Vanilla CSS3 (Design System with Dark Mode and CSS variables), JavaScript (ES6 Modules).
- **Architecture:** Client-Server / RESTful API architecture. UI prototype is located in `wireframes/perspective_dashboard/`.
- **Conventions:** Flex container layout classes must be placed on inner `<div>` elements inside `<td>` cells to preserve HTML table column alignment.

## Open questions

- Connection and live integration between the UI prototype in `wireframes/perspective_dashboard/` and the backend REST API.

## Links

- PRD: [docs/PRD.md](file:///C:/Users/Marco/Documents/ObDocs/docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](file:///C:/Users/Marco/Documents/ObDocs/docs/ARCHITECTURE.md)
- UI Prototype: [wireframes/perspective_dashboard/index.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/index.html)
- rules: business-rules.md · decisions: decisions.md · environment: environment.md

## Timeline

- 2026-08-26 — Completed Phase 3 Backend implementation (Passo 1 to Passo 9) with 140/140 automated Vitest tests covering Auth, Documents, Admin, Renewals, Audit, Notifications, Cron, Calendar, Dashboard, and Reports.
- 2026-08-24 — Personalized aihaus-okf engine with real repository evidence from PRD v0.2.0 and Architecture v1.0.0.
- 2026-06-23 — Seeded from the aihaus-okf project template.

