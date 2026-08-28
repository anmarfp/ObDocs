---
id: T-260827-dd09a2
title: Fase 4 - Integração Full-Stack, Docker Compose Unificado, Scripts e Testes E2E
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
Consolidar a entrega do sistema DocsOb com integração full-stack completa:
1. Scripts unificados no package.json raiz (dev:all, uild:all, 	est:all, lint, etc.) gerenciando backend e frontend de forma integrada.
2. Setup do docker-compose.yml completo (PostgreSQL + Backend Node/Express + Frontend Vite/Nginx ou build local) para execução "Local-First" do sistema com 1 único comando (docker compose up).
3. Suíte de testes integrados / End-to-End (E2E) cobrindo o fluxo completo: autenticação -> dashboard -> criação e renovação de documento com anexo -> calendário -> relatório -> auditoria e gestão de usuários.
4. Documentação de operação (README.md atualizado com guia passo a passo de inicialização, credenciais padrão de seed e execução de testes).

## Context
- PRD: docs/PRD.md (Seção 8 - Local-First no MVP)
- Backend: 140 testes verdes
- Frontend: 28 testes verdes e build de produção validado
- Pipeline Multiagente: procedures.md:37 (Reutilização estrita dos terminais fixos da Orca)

## Checklist
- [x] 1. Mint do card Kanban e inicialização da Fase 4 (Orquestrador)
- [ ] 2. Elaboração do plano detalhado de dockerização, scripts e testes E2E (Planner via Orca - planner-frontend)
- [ ] 3. Auditoria adversária e elaboração do prompt de implementação (Reviewer via Orca - eviewer-codex)
- [ ] 4. Desenvolvimento da infraestrutura Docker, scripts raiz e testes E2E (Implementer via Orca - implementer-antigravity)
- [ ] 5. Escrita e execução da suíte de testes de homologação E2E (QA via Orca - qa-codex)
- [ ] 6. Validação executável, atualização do Kanban e relatório final (Orquestrador)

## Log
- 2026-08-27 — Tarefa criada e pipeline multiagente da Fase 4 iniciado pelo Orquestrador.
