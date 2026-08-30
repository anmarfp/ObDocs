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
- [x] `gcalService.ts` reescrito para chamadas reais (insert/update), sem strings fake
- [x] Renovação de token via refresh persistida
- [x] `backend/tests/notification-gcal.test.ts` (describe `gcalService`) atualizado
      com mocks da lib do Google cobrindo sucesso/token expirado/falha de rede
- [x] `npm --prefix backend test` passa
- [x] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
- 2026-08-30 — subtarefa 3 implementada (`backend/src/services/gcalService.ts`
  reescrito). Resumo:
  - **De quem é o token**: confirmado `document.createdById` (o usuário que
    cadastrou o documento) como já sugerido no Context/Escopo — `Document` não tem
    campo de "dono da agenda" separado. Sem `GoogleOAuthToken` para esse usuário →
    `SyncStatus.ERROR` com mensagem "Usuário não conectou o Google Agenda." antes de
    qualquer chamada de rede.
  - **Corpo do evento enviado ao Google**: evento de dia inteiro (`start.date` /
    `end.date`, sem `dateTime`) no dia do vencimento — `summary: doc.title`,
    `start: { date: 'YYYY-MM-DD' }` (o `expirationDate`), `end: { date: 'YYYY-MM-DD' }`
    (dia seguinte, pois a API do Google usa fim exclusivo em eventos de dia
    inteiro). `calendarId: 'primary'` (agenda pessoal do usuário, conforme ADR-009).
  - **Sem duplicar evento**: antes de decidir insert vs update, busca o
    `GCalSyncLog` mais recente do documento com `status: SYNCED` e `gcalEventId`
    não nulo (`findMany` com `orderBy: lastSyncedAt desc, take: 1`); se existir,
    chama `calendar.events.update({ calendarId: 'primary', eventId: <id salvo>,
    requestBody })`; senão, `calendar.events.insert(...)`. O id real retornado por
    `response.data.id` é sempre o gravado no novo `GCalSyncLog`.
  - **Renovação de token**: `oauth2Client.on('tokens', (tokens) => ...)` persiste
    `accessToken`/`expiryDate`/(`refreshToken`, se vier um novo) via
    `prisma.googleOAuthToken.update` assim que a lib `googleapis` renova
    automaticamente — testado disparando manualmente o listener capturado pelo
    mock e verificando o `update`.
  - **Enum `SyncStatus`**: adicionado um terceiro valor `DELETED` (migration
    `20260830203917_add_sync_status_deleted`, `ALTER TYPE "SyncStatus" ADD VALUE
    'DELETED'`, aplicada no Postgres local) em vez de reaproveitar `SYNCED` com
    `gcalEventId: null` — mais claro para quem lê `gcal_sync_logs` depois. Nova
    função exportada `deleteDocumentEvent(doc: { id, createdById })` usa o mesmo
    critério de busca do último evento sincronizado; se não houver evento real
    para remover, não chama a API nem grava log (nada mudou); se houver, chama
    `calendar.events.delete({ calendarId: 'primary', eventId })` e grava
    `DELETED` (sucesso) ou `ERROR` (falha). Ainda não é chamada por ninguém —
    fica para a subtarefa 4 decidir quando disparar.
  - **Erros reais cobertos** (todos resolvem `SyncDocumentEventResult`, nunca
    lançam exceção não tratada, e sempre gravam `GCalSyncLog`): usuário nunca
    conectou (mensagem própria antes de qualquer chamada); token
    rejeitado/revogado pelo Google (`invalid_grant`/401 → mensagem pedindo para
    reconectar); falha de rede (`ENOTFOUND`/`ECONNREFUSED`/`ECONNRESET`/
    `ETIMEDOUT`/`EAI_AGAIN` ou mensagem contendo "network" → mensagem de falha de
    rede); rate limit/quota (`429`, ou `403` com `reason` em
    `rateLimitExceeded`/`userRateLimitExceeded`/`quotaExceeded`/
    `dailyLimitExceeded` → mensagem de limite de requisições); e o caso já
    existente de documento sem `expirationDate`.
  - Testes: `describe('gcalService')` em `backend/tests/notification-gcal.test.ts`
    reescrito cobrindo insert sem log anterior, update reaproveitando
    `gcalEventId` (sem duplicar), usuário não conectado, `invalid_grant`, falha de
    rede, rate limit/quota, persistência da renovação de token, e
    `syncAllDocuments` agregando totais (inclusive com falha parcial).
    `npm --prefix backend run build` passa; `npm --prefix backend test`: 166/167
    passam — a única falha é a pré-existente e já documentada
    (`cronService` › "recalcula documentos ativos..." — fixture com data
    hardcoded colidindo com a data real de hoje), não relacionada a esta
    subtarefa.
- 2026-08-30 — Revisão do orquestrador antes do merge: encontrado um bug real na
  busca do "último evento" (`findLastSyncedEvent`, agora `findCurrentGcalEventId`).
  A busca filtrava só `status: SYNCED`, ignorando qualquer `DELETED` posterior —
  então, depois de um documento ser arquivado/excluído (removendo o evento via
  `deleteDocumentEvent`, que esta mesma subtarefa introduziu) e depois reativado
  com nova data de vencimento, a próxima sincronização tentaria `events.update`
  num evento que não existe mais no Google (404), em vez de criar um novo. Corrigido
  para buscar o registro `SYNCED`/`DELETED` mais recente (ignorando `ERROR`, que
  nunca deveria "esquecer" um evento real por causa de uma falha transitória) e
  tratar `DELETED` como "sem evento atual" → insert. Adicionados 2 testes de
  regressão (insert após DELETED; a query exclui ERROR) e uma suíte completa para
  `deleteDocumentEvent` (nenhum teste cobria essa função nova). `npm --prefix
  backend test` após a correção: 173/174 (mesma falha pré-existente e não
  relacionada). PR aberta e mesclada em `main` em seguida.
