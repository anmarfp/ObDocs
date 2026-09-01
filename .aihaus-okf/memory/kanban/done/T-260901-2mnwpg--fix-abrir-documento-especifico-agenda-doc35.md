---
id: T-260901-2mnwpg
title: "DOC-35: abrir pagina especifica do documento a partir da agenda"
status: done
owner: "-"
workflow: bugfix
created: 2026-09-01
links: ["DOC-35"]
---

## Goal
Na secao de Agenda/Calendario, ao clicar em um documento e depois em "Abrir em
Documentos", abrir a pagina de detalhe daquele documento especifico em vez da
listagem geral `/documentos`.

## Context
- Delegado a um agente Codex (gpt-5.6-sol) via `orca worktree create --agent
  codex` (worktree independente em `C:/Users/Marco/orca/workspaces/ObDocs/`),
  conforme nova diretriz do usuario de usar orca-cli em vez do tool `Agent`
  para subagentes.
- Ver `knowledge.md` para os gotchas descobertos ao operacionalizar isso
  (escaping do prompt no Windows, config.toml corrompido, `tui-idle` pouco
  confiavel).

## Escopo
- `frontend/src/pages/calendar/CalendarPage.tsx`: o `Link` do modal de detalhes
  do evento selecionado passou de `to="/documentos"` para
  `` to={`/documentos/${selectedEvent.id}`} `` (rota `documentos/:id` ja
  existente).

## Validação
- `npm --prefix frontend run build` e `npm --prefix frontend test` (28/28)
  passam, verificados independentemente pelo orquestrador no worktree e
  novamente apos o merge em `main`.

## Checklist
- [x] Causa raiz confirmada nos arquivos-fonte
- [x] Correção aplicada e commitada (`a0347c2`)
- [x] Build e testes de frontend sem regressão
- [x] PR aberta e mesclada em `main`

## Log
- 2026-09-01 — Corrigido via agente Codex, revisado e mesclado (PR #9,
  `be3eae5`). Container `frontend` reconstruído.
