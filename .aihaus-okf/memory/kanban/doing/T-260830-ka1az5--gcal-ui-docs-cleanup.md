---
id: T-260830-ka1az5
title: "DOC-28 (5/5): remover banner de simulação, ajustar UI e atualizar PRD/ARCHITECTURE"
status: doing
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
- [x] Banner de simulação removido de `CalendarPage.tsx`
- [x] Toast de sync ajustado
- [x] `SyncLogsModal.tsx` revisado
- [x] `docs/PRD.md` (RF-005) atualizado
- [x] `docs/ARCHITECTURE.md` atualizado com o fluxo OAuth
- [x] `npm --prefix frontend test` (se houver teste de snapshot/texto do banner)
      passa
- [x] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
- 2026-08-30 — subtarefa 5/5 implementada (fecha DOC-28). Resumo por arquivo:
  - **`frontend/src/pages/calendar/CalendarPage.tsx`**: removido o banner
    "Sincronização Simulada / Local" (bloco `<div>` com ícone `Info`, linhas
    ~218-224) e o import não usado de `Info` (lucide-react, `noUnusedLocals`
    quebraria o build). No `handleSync`, o toast de sucesso passou de
    `"... sincronizados (modo simulado/local)."` para
    `"... sincronizados com o Google Agenda."`.
  - **`frontend/src/features/calendar/components/SyncLogsModal.tsx`**:
    re-verificado — nenhuma menção a "simulad[ao]" encontrada (nada a alterar).
  - **`docs/PRD.md`**: bullet `[RF-005]` reescrito — troca "modo de simulação
    local-first com logging detalhado" por descrição do fluxo real: conexão
    OAuth2 individual por usuário (ADR-009) em Configurações antes de
    sincronizar, disparo automático em criar/editar/arquivar/excluir documento
    (RN-007) além do botão manual, e logs (`gcal_sync_logs`) seguem restritos a
    `ADMIN`.
  - **`docs/ARCHITECTURE.md`**: (1) ERD (seção 2) ganhou a entidade
    `GOOGLE_OAUTH_TOKEN` e a relação `USER ||--o| GOOGLE_OAUTH_TOKEN`, e
    `GCAL_SYNC_LOG.status` passou a listar `SYNCED | ERROR | DELETED`; (2)
    seção 3: `3.7 gcal_sync_logs` documenta os 3 valores de `status` (incluindo
    `DELETED`, adicionado na subtarefa 3/hihhvj e antes ausente da doc) e nova
    `3.8 google_oauth_tokens` com todos os campos do schema Prisma
    (`id, userId, accessToken, refreshToken, expiryDate, scope, createdAt,
    updatedAt`); (3) nova seção `6.3 Sincronização Real com Google Agenda via
    OAuth (RF-005 / RN-007 / ADR-009)` — diagrama de sequência cobrindo a
    conexão (connect → consentimento Google → callback público valida `state`
    assinado → upsert de tokens) e o gatilho automático (create/update/
    archive/delete em `documentController.ts` → `gcalService.ts` resolve o
    token pelo `created_by_id`, reusa o `gcalEventId` já logado em
    `gcal_sync_logs` para decidir `update`/`delete` em vez de duplicar, só faz
    `insert` quando não há log `SYNCED` anterior) — sem adicionar uma nova
    entrada numerada em "7. ADRs" (referencia ADR-009 por nome, conforme
    orientado).
  - **Achados extras no grep final de "simula" (item 6 do Escopo)**, corrigidos
    por serem sobre a mesma simulação do Google Agenda (não tocados os
    "simulada" de outros domínios — ex. `notificationService.ts`,
    `auth.test.ts`, mocks de falha de rede em `document-gcal-trigger.test.ts`):
    `README.md:207` ("simulação local" → "OAuth por usuário"),
    `frontend/src/features/calendar/services/calendarService.ts:28`
    (comentário "(local/simulated)" removido), e
    `frontend/src/pages/dashboard/DashboardPage.tsx:538` (card "Informações do
    Sistema": "Simulado / Local" → "Real via OAuth").
  - **Teste ajustado**: `frontend/tests/calendar-audit.test.tsx` — removida a
    asserção do banner (`Sincronização Simulada / Local`) e atualizada a
    regex do toast de `/3 de 4 documento\(s\).*simulado\/local/i` para
    `/3 de 4 documento\(s\).*Google Agenda/i`; título do teste também
    atualizado.
  - **Validação**: `npm --prefix frontend run build` (tsc + vite build) OK;
    `npm --prefix frontend test` → 28/28 passando; `npm --prefix backend test`
    → 184/185 (única falha pré-existente e já documentada,
    `notification-gcal.test.ts` › `cronService` › "recalcula documentos
    ativos...", fixture de data hardcoded — não relacionada a este trabalho).
  - Não tocado: `gcalService.ts`, `documentController.ts`,
    `googleAuthController.ts`, `calendarRoutes.ts`, `SettingsPage.tsx`
    (fora de escopo desta subtarefa).
