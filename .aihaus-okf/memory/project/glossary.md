---
type: glossary
owner: product
status: active
last_reviewed: 2026-08-24
---

# Glossary — DocsObs

> Domain terms and project-specific nomenclature.

## Current truth

| Term | Definition |
| --- | --- |
| **DocsObs** | System name — Sistema de Gestão e Acompanhamento de Vencimento de Documentos. |
| **Matriz de Cores** | Visual status system consisting of 🔴 Vencido, 🟡 Alerta Crítico, 🔵 Em Renovação, 🟢 Regular, ⚪ Indeterminado. |
| **Antecedência do Alerta (Lead Time)** | Customizable advance notification threshold in days (e.g., 60, 30, 15, 7 days) before document expiration. |
| **Soft Delete (Arquivamento)** | Archiving a document to hide it from general operational views without deleting the record (visible exclusively to Admins). |
| **Hard Delete (Exclusão Permanente)** | Permanent deletion of document records entered by mistake, available strictly to Admins. |
| **Audit Log (Trilha de Auditoria)** | Immutable change history tracking user ID, timestamp, action type, and detailed value diffs (`old` vs `new`). |
| **Notification Mode (RN-004)** | Enterprise global setting: either `ALL_ADMINS` (notifies all admins; hides Responsible field) or `ONLY_RESPONSIBLE` (notifies designated responsible email; requires Responsible field). |
| **RBAC** | Role-Based Access Control enforcing `ADMIN` (full access) vs `OPERATIONAL` (restricted access) permissions. |

## Details

- Source definitions extracted from `docs/PRD.md` sections 3, 4, 6, and 8.

## Open questions

- Additional terms for post-MVP multi-tenant features.

## Links

- PRD: [docs/PRD.md](file:///C:/Users/Marco/orca/workspaces/ObDocs/huchen/docs/PRD.md)

## Timeline

- 2026-08-24 — Glossary populated from PRD v0.2.0 definitions.
- 2026-06-23 — Seeded from the aihaus-okf project template.
