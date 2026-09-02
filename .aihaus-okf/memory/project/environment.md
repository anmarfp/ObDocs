---
type: environment
owner: ops
status: active
last_reviewed: 2026-08-24
---

# Environment — DocsObs

> Stack, services, tools, and local setup.

## Current truth

- **Repository:** `https://github.com/anmarfp/ObDocs.git`
- **Active Branch:** `Criar-o-protótipo-da-UI`
- **Frontend Prototype Stack:** Pure HTML5, Vanilla CSS3 (Design System tokens), Vanilla JavaScript (ES6 Modules).
- **Target Backend Stack (Planned):** Node.js (TypeScript), Express / NestJS, PostgreSQL + Prisma ORM, S3 / Supabase Storage, Resend / SendGrid (SMTP), Google Calendar API (OAuth 2.0).

## Details

- **File Structure:**
  - `docs/PRD.md`: Product Requirements Document (v0.2.0)
  - `docs/ARCHITECTURE.md`: Architecture Specification (v1.0.0)
  - `wireframes/perspective_dashboard/`: Interactive HTML/CSS/JS UI prototype pages (`index.html`, `documentos.html`, `detalhes-documento.html`, `calendario.html`, `notificacoes.html`, `usuarios.html`, `configuracoes.html`, `auditoria.html`, `perfil.html`, `styles.css`).

## Open questions

- Production hosting provider (Vercel / Render / AWS) for full stack deployment.

## Links

- project: project.md · procedures: procedures.md

## Timeline

- 2026-08-24 — Environment details populated from repository setup and architecture docs.
- 2026-06-23 — Seeded from the aihaus-okf project template.
