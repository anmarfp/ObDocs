---
type: project
owner: project
status: active
last_reviewed: 2026-08-24
---

# Project — DocsOb

> Document Expiration & Renewal Management System (Gestão de Vencimento de Documentos).

## Current truth

DocsOb is a web application designed to proactively track document expiration dates (contracts, licenses, tax certificates, insurance policies, worker obligations) via color-coded status matrices, automated email alerts, Google Calendar synchronization, role-based access control (RBAC), and an immutable audit log. The repository currently contains the Phase 1 PRD (`docs/PRD.md`), Phase 2 Architecture Specification (`docs/ARCHITECTURE.md`), and the interactive UI prototype (`wireframes/perspective_dashboard/`).

## Details

- **Stack:** HTML5, Vanilla CSS3 (Design System with Dark Mode and CSS variables), JavaScript (ES6 Modules). Planned backend: Node.js (TypeScript), PostgreSQL (Prisma), Express/NestJS, S3/Supabase Storage.
- **Architecture:** Client-Server / RESTful API architecture. UI prototype is located in `wireframes/perspective_dashboard/`.
- **Conventions:** Flex container layout classes must be placed on inner `<div>` elements inside `<td>` cells to preserve HTML table column alignment.

## Open questions

- Backend API implementation start date (Node.js/TypeScript REST API setup).

## Links

- PRD: [docs/PRD.md](file:///C:/Users/Marco/orca/workspaces/ObDocs/huchen/docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](file:///C:/Users/Marco/orca/workspaces/ObDocs/huchen/docs/ARCHITECTURE.md)
- UI Prototype: [wireframes/perspective_dashboard/index.html](file:///C:/Users/Marco/orca/workspaces/ObDocs/huchen/wireframes/perspective_dashboard/index.html)
- rules: business-rules.md · decisions: decisions.md · environment: environment.md

## Timeline

- 2026-08-24 — Personalized aihaus-okf engine with real repository evidence from PRD v0.2.0 and Architecture v1.0.0.
- 2026-06-23 — Seeded from the aihaus-okf project template.
