---
id: T-260901-ozoww5
title: "DOC-30: remover Gerenciar Documentos e mover Exportar Relatorio para Documentos"
status: done
owner: "-"
workflow: bugfix
created: 2026-09-01
links: ["DOC-30"]
---

## Goal
No Dashboard, remover o botão "Gerenciar Documentos" e mover o botão "Exportar
Relatório" (com o modal associado) para a página de Documentos.

## Context
- Delegado a um agente Codex (gpt-5.6-sol) via `orca worktree create --agent
  codex`, mesma abordagem de T-260901-2mnwpg (DOC-35).

## Escopo
- `frontend/src/pages/dashboard/DashboardPage.tsx`: removidos o `Link`
  "Gerenciar Documentos", o botão "Exportar Relatório", o state
  `exportModalOpen`, o render do `ReportExportModal`, e os imports agora não
  utilizados (`Plus`, `Download`, `ReportExportModal`, `toastSuccess`).
- `frontend/src/pages/documents/DocumentsPage.tsx`: adicionado o botão
  "Exportar Relatório" (mesmo visual/comportamento) entre "Atualizar" e "Novo
  Documento", reusando os toasts (`toastSuccess`/`toastError`) já existentes
  na página.

## Validação
- `npm --prefix frontend run build` e `npm --prefix frontend test` (28/28)
  passam, verificados independentemente pelo orquestrador no worktree e
  novamente após o merge em `main`.

## Checklist
- [x] Correção aplicada e commitada (`1d664f1`)
- [x] Build e testes de frontend sem regressão
- [x] PR aberta e mesclada em `main`

## Log
- 2026-09-01 — Corrigido via agente Codex, revisado e mesclado (PR #10,
  `be3eae5`). Container `frontend` reconstruído.
