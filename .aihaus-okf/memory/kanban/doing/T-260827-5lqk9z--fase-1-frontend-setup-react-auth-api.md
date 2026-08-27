---
id: T-260827-5lqk9z
title: Fase 1 - Setup do Frontend React + Vite + TypeScript e Camada Base de API/Auth
status: doing
owner: orchestrator
workflow: feature
created: 2026-08-27
links:
  - docs/PRD.md
  - docs/ARCHITECTURE.md
  - .aihaus-okf/memory/project/decisions.md
  - .aihaus-okf/memory/project/procedures.md
---

## Goal
Executar a Fase 1 do Frontend DocsOb:
1. Configuração do projeto React + TypeScript + Vite em `frontend/` com Tailwind CSS e tokens Midnight Navy.
2. Camada de API tipada (`api.ts`) com interceptor JWT e tratamento de erros (401/403/500).
3. Contexto de Autenticação (`AuthContext.tsx`), hook `useAuth`, `ProtectedRoute` (RBAC) e página de Login funcional conectada ao backend (`POST /api/v1/auth/login` e `GET /api/v1/auth/me`).

## Context
- PRD: docs/PRD.md (RF-014, RNF-001, RNF-003)
- Arquitetura: docs/ARCHITECTURE.md
- Backend: backend/ (API em /api/v1/auth/*)
- Pipeline Multiagente: procedures.md:34

## Checklist
- [x] 1. Mint do card Kanban e inicialização do pipeline (Orquestrador)
- [ ] 2. Elaboração do plano detalhado da Fase 1 com prompt rico (Planner via Orca)
- [ ] 3. Auditoria adversária e formulação do prompt de implementação (Reviewer via Orca)
- [ ] 4. Desenvolvimento do código de produção (Implementer via Orca)
- [ ] 5. Escrita e execução da suíte de testes automatizados (QA via Orca)
- [ ] 6. Validação executável, atualização do Kanban e relatório final (Orquestrador)

## Log
- 2026-08-27 — Tarefa criada e pipeline multiagente disparado pelo Orquestrador.
