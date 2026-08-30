---
id: T-260830-hihhvj
title: "DOC-28 (3/5): reescrever gcalService.ts para chamadas reais à Google Calendar API"
status: doing
owner: "-"
workflow: feature
created: 2026-08-30
links: ["DOC-28", "ADR-009", "T-260830-bbinpu", "T-260830-4e2ce4"]
---

## Goal
Substituir a simulação em `backend/src/services/gcalService.ts` por chamadas reais
`calendar.events.insert/update/delete`, autenticadas com o token OAuth do usuário
(persistido na subtarefa 2), com tratamento real de erro. Este é o coração do
ticket DOC-28.

## Pré-requisito
Depende de T-260830-bbinpu (tokens OAuth persistidos e recuperáveis por `userId`)
já mesclado em `main`.

## Context
- Serviço atual (82 linhas): `backend/src/services/gcalService.ts` — `gcalEventId`
  fake na linha 41 (`gcal-event-${doc.id}`), sem OAuth, sem rede.
- Schema: `backend/prisma/schema.prisma:144` (`GCalSyncLog` — `gcalEventId`,
  `status: SyncStatus` enum `SYNCED|ERROR`, `errorMessage`).
- `Document` model: `backend/prisma/schema.prisma:83` (tem `createdById` → `User`;
  hoje não há campo para "de quem é a agenda" além do criador).
- Ponto de entrada manual: `POST /calendar/sync` → `syncCalendar` em
  `backend/src/controllers/calendarController.ts:103` → `syncAllDocuments()`.
- Teste existente a atualizar/estender:
  `backend/tests/notification-gcal.test.ts:187-228` (describe `gcalService`) — hoje
  testa contra o comportamento simulado (`SyncStatus.SYNCED` sempre que há
  `expirationDate`). Precisa mockar a lib do Google (sucesso, token expirado, falha
  de rede) em vez de assumir sucesso sempre.
- ADR-009 (`.aihaus-okf/memory/project/decisions.md`): token é por usuário, não uma
  conta única — o serviço precisa decidir de qual usuário buscar o token.

## Escopo
1. Definir e documentar (comentário curto ou ADR se for uma decisão não óbvia) de
   qual usuário o serviço busca o token OAuth para um dado documento — sugestão:
   `document.createdBy` (o usuário que cadastrou o documento), já que é o dado
   disponível hoje sem mudar o schema de `Document`. Se esse usuário nunca conectou
   sua agenda (sem linha em `GoogleOAuthToken`), gravar `SyncStatus.ERROR` com
   mensagem clara ("Usuário não conectou o Google Agenda") em vez de tentar a
   chamada.
2. Construir um `OAuth2Client` autenticado com o token do usuário; usar o
   refresh-token para renovar automaticamente (a lib `googleapis` já suporta
   `oauth2Client.on('tokens', ...)` para persistir um `accessToken` renovado —
   reaproveitar isso para manter `GoogleOAuthToken` atualizado).
3. `syncDocumentEvent`: `calendar.events.insert` na primeira sincronização; nas
   seguintes, `calendar.events.update` usando o `gcalEventId` já salvo em
   `GCalSyncLog` (não duplicar evento) — ver critério de aceitação "Editar a data
   de vencimento atualiza o evento existente (não duplica)".
4. Cancelamento/remoção: quando o documento for arquivado/excluído, chamar
   `calendar.events.delete`. Verificar onde isso deveria ser disparado (arquivar é
   em `documentController.ts`, provavelmente já coberto pela subtarefa 4 do gatilho
   automático — coordenar/confirmar contra o que a subtarefa 4 implementar).
5. Tratamento real de erro: token revogado/expirado sem refresh válido, falha de
   rede, rate limit — cada um deve gravar `SyncStatus.ERROR` com `errorMessage`
   útil (não genérico).
6. Manter a assinatura pública de `syncDocumentEvent`/`syncAllDocuments` estável o
   quanto possível para não quebrar os chamadores existentes
   (`calendarController.ts`, e o novo gatilho da subtarefa 4).

## Fora de escopo
- Endpoints de conexão OAuth (já feitos na subtarefa 2).
- Disparo automático em create/update de documento (subtarefa 4) — aqui só a
  reescrita do serviço em si, ainda chamado manualmente via `/calendar/sync`.
- Banner/textos do frontend (subtarefa 5).

## Critérios de aceitação relevantes (do ticket DOC-28)
- [ ] Documento com vencimento cria evento real e visível na Google Agenda
- [ ] Editar a data de vencimento atualiza o evento existente (não duplica)
- [ ] `gcal_sync_logs` registra o ID real retornado pela API do Google
- [ ] Falhas reais (token revogado, sem rede, quota) → `status: ERROR` + mensagem útil
- [ ] Testes cobrindo o serviço com a API do Google mockada (sucesso, token
      expirado, falha de rede)

## Checklist
- [ ] `gcalService.ts` reescrito para chamadas reais (insert/update), sem strings fake
- [ ] Renovação de token via refresh persistida
- [ ] `backend/tests/notification-gcal.test.ts` (describe `gcalService`) atualizado
      com mocks da lib do Google cobrindo sucesso/token expirado/falha de rede
- [ ] `npm --prefix backend test` passa
- [ ] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
