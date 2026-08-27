---
id: T-260827-dsh003
title: Fase 3 - Frontend Dashboard Executivo, Métricas em Tempo Real e Exportação de Relatórios
status: doing
owner: orchestrator
workflow: feature
created: 2026-08-27
links:
  - docs/PRD.md
  - docs/ARCHITECTURE.md
  - .aihaus-okf/memory/project/procedures.md
  - .aihaus-okf/memory/project/decisions.md
---

## Goal
Implementar a Fase 3 do Frontend DocsOb:
1. Dashboard Executivo integrado com a API `GET /dashboard/metrics` (Cards de métricas por status, contadores dinâmicos e taxa de conformidade).
2. Gráficos interativos (distribuição por categoria e linha do tempo de vencimentos nos próximos 30/60/90 dias).
3. Tabela de Alertas de Vencimento Imediato (documentos Vencidos e Críticos) com navegação direta e ações rápidas.
4. Módulo de Exportação de Relatórios com suporte a download autenticado de CSV e PDF com filtros avançados (`/reports/documents`).
5. Suíte de testes automatizados com Vitest cobrindo renderização das métricas, gráficos, filtros e download de relatórios.

## Context
- PRD: docs/PRD.md (RF-009, RF-010, RF-011, RF-014)
- Backend Endpoints: `backend/src/routes/dashboardRoutes.ts`, `backend/src/routes/reportRoutes.ts`
- Pipeline Multiagente: `procedures.md:37` (Uso estrito dos terminais existentes da Orca)

## Checklist
- [x] 1. Mint do card Kanban e inicialização da Fase 3 (Orquestrador)
- [ ] 2. Elaboração do plano detalhado de componentes e serviços da Fase 3 (Planner via Orca - `planner-frontend`)
- [ ] 3. Auditoria adversária e elaboração do prompt de implementação (Reviewer via Orca - `reviewer-codex`)
- [ ] 4. Desenvolvimento do código de produção do Dashboard e Relatórios (Implementer via Orca - `implementer-antigravity`)
- [ ] 5. Escrita e execução da suíte de testes automatizados (QA via Orca - `qa-codex`)
- [ ] 6. Validação executável, atualização do Kanban e relatório final (Orquestrador)

## Log
- 2026-08-27 — Tarefa criada e pipeline multiagente da Fase 3 iniciado pelo Orquestrador.
