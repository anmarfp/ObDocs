---
id: T-260830-ka1az5
title: "DOC-28 (5/5): remover banner de simulação, ajustar UI e atualizar PRD/ARCHITECTURE"
status: backlog
owner: "-"
workflow: feature
created: 2026-08-30
links: ["DOC-28", "ADR-009", "T-260830-hihhvj", "T-260830-4e2ce4"]
---

## Goal
Fechar o DOC-28: a UI deixa de afirmar que a sincronização é simulada, e a
documentação do produto reflete a integração real (fluxo OAuth, agenda alvo,
tratamento de refresh token) — hoje nenhuma descreve isso.

## Pré-requisito
Depende de T-260830-hihhvj e T-260830-4e2ce4 (sync real + gatilho automático) já
mesclados em `main` — só faz sentido remover o aviso de simulação quando a
sincronização deixar de ser simulada de fato.

## Context
- Banner a remover: `frontend/src/pages/calendar/CalendarPage.tsx:218-224`
  ("Sincronização Simulada / Local").
- Toast a ajustar: `CalendarPage.tsx:100-104` (`handleSync`, texto
  "modo simulado/local" no `toastSuccess`).
- Modal relacionado (conferir se também cita simulação):
  `frontend/src/features/calendar/components/SyncLogsModal.tsx`.
- Docs a atualizar: `docs/PRD.md` (RF-005 — hoje descreve "modo de simulação
  local-first") e `docs/ARCHITECTURE.md` (nenhum dos dois hoje descreve fluxo OAuth,
  agenda alvo ou tratamento de refresh token).
- Decisão a documentar como já registrada: ADR-009 em
  `.aihaus-okf/memory/project/decisions.md` (já criada nesta decomposição) — aqui é
  só referenciá-la a partir do PRD/ARCHITECTURE, não recriar a decisão.

## Escopo
1. Remover o banner "Sincronização Simulada / Local" de `CalendarPage.tsx`.
2. Ajustar o texto do toast de sucesso do sync manual (remover "modo
   simulado/local").
3. Revisar `SyncLogsModal.tsx` por qualquer menção residual a simulação.
4. Atualizar `docs/PRD.md` RF-005: descrever o fluxo OAuth por usuário (ADR-009),
   remover a menção a "simulação local-first".
5. Atualizar `docs/ARCHITECTURE.md`: descrever o fluxo OAuth (redirect/callback),
   a tabela `GoogleOAuthToken`, e o tratamento de refresh token.
6. Conferir se algum outro texto no app (ex. tooltips, `README`) ainda menciona a
   simulação e ajustar.

## Fora de escopo
- Qualquer mudança de comportamento no backend — este card é só UI/docs.

## Checklist
- [ ] Banner de simulação removido de `CalendarPage.tsx`
- [ ] Toast de sync ajustado
- [ ] `SyncLogsModal.tsx` revisado
- [ ] `docs/PRD.md` (RF-005) atualizado
- [ ] `docs/ARCHITECTURE.md` atualizado com o fluxo OAuth
- [ ] `npm --prefix frontend test` (se houver teste de snapshot/texto do banner)
      passa
- [ ] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
