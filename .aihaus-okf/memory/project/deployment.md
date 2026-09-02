---
type: deployment
owner: ops
status: active
last_reviewed: 2026-08-24
---

# Deployment — DocsObs

> Release, environment provisioning, and deployment guidelines.

## Current truth

- **Current Prototype State:** Static wireframe prototype stored in Git branch `Criar-o-protótipo-da-UI`.
- **Target Backend Architecture:** Containerized Node.js API with PostgreSQL database and S3 / Supabase blob storage.

## Details

- **Environments (Target Architecture):**
  - `Development`: Local Node.js + Docker PostgreSQL.
  - `Staging / Production`: Managed cloud host (Vercel / Render / AWS) connected to PostgreSQL (Supabase / AWS RDS).

## Open questions

- Production CI/CD pipeline definition (GitHub Actions workflow).

## Links

- environment: environment.md · procedures: procedures.md

## Timeline

- 2026-08-24 — Documented initial deployment baseline and target production environments.
- 2026-06-23 — Seeded from the aihaus-okf project template.
