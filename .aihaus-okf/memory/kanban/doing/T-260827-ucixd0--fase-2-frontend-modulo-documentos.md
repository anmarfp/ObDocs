---
id: T-260827-ucixd0
title: Fase 2 - Frontend Módulo de Documentos (CRUD, Upload Drag & Drop, Filtros, Detalhes e Renovação)
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
Implementar a Fase 2 do Frontend DocsOb:
1. Listagem completa de documentos com tabela interativa, ordenação, paginação, busca e filtros (Status, Categoria, Período de Vencimento).
2. Modal/Página de Upload com suporte a Drag & Drop (arquivos PDF, PNG, JPG de até 10MB) com seleção de Categoria e Data de Vencimento.
3. Tela/Modal de Detalhes do Documento com visualizador/download de anexo, metadados e histórico de versões.
4. Fluxo de Renovação de Documento com upload de novo anexo e atualização da data de vencimento.
5. Suíte de testes automatizados com Vitest e React Testing Library cobrindo upload, listagem, filtros e renovação.

## Context
- PRD: docs/PRD.md (RF-001, RF-002, RF-003, RF-004, RF-005, RF-007, RF-014)
- Backend Endpoints: backend/src/routes/document.routes.ts, category.routes.ts
- Pipeline Multiagente: procedures.md:34

## Checklist
- [x] 1. Mint do card Kanban e inicialização da Fase 2 (Orquestrador)
- [ ] 2. Elaboração do plano detalhado de componentes e rotas da Fase 2 (Planner via Orca)
- [ ] 3. Auditoria adversária e formulação do prompt de implementação (Reviewer via Orca)
- [ ] 4. Desenvolvimento do código de produção dos documentos (Implementer via Orca)
- [ ] 5. Escrita e execução da suíte de testes automatizados (QA via Orca)
- [ ] 6. Validação executável, atualização do Kanban e relatório final (Orquestrador)

## Log
- 2026-08-27 — Tarefa criada e pipeline multiagente da Fase 2 iniciado pelo Orquestrador.
