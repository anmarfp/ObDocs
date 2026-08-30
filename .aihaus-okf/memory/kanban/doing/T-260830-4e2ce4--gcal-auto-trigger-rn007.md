---
id: T-260830-4e2ce4
title: "DOC-28 (4/5): gatilho automático de sync em criar/editar/excluir documento (RN-007)"
status: doing
owner: "-"
workflow: feature
created: 2026-08-30
links: ["DOC-28", "ADR-009", "RN-007", "T-260830-hihhvj", "T-260830-ka1az5"]
---

## Goal
Fazer criar, editar ou arquivar/excluir um documento disparar automaticamente a
sincronização com o Google Agenda, conforme RN-007
(`.aihaus-okf/memory/project/business-rules.md`): "A criação ou alteração da data
de vencimento de um documento cria ou atualiza automaticamente o evento no Google
Agenda". Hoje isso **não acontece** — `syncDocumentEvent`/`syncAllDocuments` só são
chamados via `POST /calendar/sync` manual (confirmado: nenhuma outra chamada existe
no código-fonte hoje).

## Pré-requisito
Depende de T-260830-hihhvj (gcalService.ts já fazendo chamadas reais) já mesclado
em `main`. Sem essa dependência, disparar automaticamente ainda syncaria com a
simulação.

## Context
- `backend/src/controllers/documentController.ts`:
  - `createDocument` (linha 142) — cria o documento, depois grava `AuditLog`
    (linha ~220), depois responde. Sem chamada a `syncDocumentEvent` hoje.
  - `updateDocument` (linha 398) — verificar se altera `expirationDate`.
  - `deleteDocument`/arquivamento (linha 671) — verificar se é hard delete ou
    soft-delete via `isArchived` (RN-002 menciona imutabilidade de histórico) e
    qual fluxo corresponde a "arquivar" nos critérios de aceitação do DOC-28
    ("Arquivar/excluir um documento remove ou cancela o evento correspondente").
- `syncDocumentEvent(doc, action)` já aceita um parâmetro `action` (hoje só usado
  como rótulo — `'sync'`/`'create'`/`'update'` nos testes) — decidir se o serviço
  usa esse `action` para diferenciar insert/update/delete ou se isso é inferido
  internamente pela existência de um `GCalSyncLog` prévio.

## Escopo
1. `createDocument`: após persistir o documento (e o `AuditLog`), chamar
   `syncDocumentEvent(document, 'create')` quando houver `expirationDate`. Não
   bloquear a resposta ao usuário em caso de falha de sync — logar/gravar
   `GCalSyncLog` com `ERROR` e responder 201 normalmente (a criação do documento
   não deve falhar por causa do Google).
2. `updateDocument`: chamar `syncDocumentEvent(document, 'update')` quando
   `expirationDate` mudar (ou sempre que o documento tiver `expirationDate`, para
   simplificar — decidir e justificar na implementação).
3. Arquivamento/exclusão: disparar a remoção/cancelamento do evento
   correspondente (via a função de delete implementada na subtarefa 3).
4. Mesma regra de não-bloqueio: falha na sincronização não deve impedir a operação
   principal no documento (criar/editar/arquivar continuam funcionando mesmo se o
   Google estiver fora do ar).

## Fora de escopo
- Mudanças em `gcalService.ts` além de chamá-lo (a lógica real já está pronta pela
  subtarefa 3).
- UI/banner (subtarefa 5).

## Checklist
- [x] `createDocument` dispara sync ao criar documento com vencimento
- [x] `updateDocument` dispara sync ao alterar a data de vencimento
- [x] Arquivar/excluir dispara remoção do evento correspondente
- [x] Falha de sync não bloqueia a resposta HTTP da operação principal
- [x] Testes cobrindo os 3 gatilhos (mock de `gcalService`, seguindo o padrão de
      `vi.mock` já usado em `backend/tests/notification-gcal.test.ts`)
- [x] `npm --prefix backend test` passa
- [x] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
- 2026-08-30 — Implementação concluída em `backend/src/controllers/documentController.ts`
  (+ novo `backend/tests/document-gcal-trigger.test.ts`, mockando `gcalService.js`
  diretamente conforme instruído):
  - **`createDocument`**: após o `AuditLog`, dispara `syncDocumentEvent(document, 'create')`
    quando `document.expirationDate` existe. Sem gatilho quando não há vencimento.
  - **`updateDocument`** (decisão de projeto, escopo deixado em aberto pela tarefa):
    optei por restringir o gatilho a `diffData.expirationDate` presente (ou seja, só
    quando a data de vencimento efetivamente mudou), em vez de disparar em qualquer
    edição do documento. Justificativa: (1) é mais fiel à redação literal da RN-007
    ("criação ou alteração da **data de vencimento**"); (2) evita chamadas de rede
    reais à API do Google a cada edição de campo não relacionado (ex.: notas,
    responsável), o que seria desperdício de quota e I/O numa ação que hoje é
    síncrona com a resposta HTTP. Trade-off aceito: um título alterado sem mexer no
    vencimento deixa o `summary` do evento existente desatualizado até a próxima
    alteração de data — considerado aceitável porque RN-007 fala especificamente de
    data de vencimento, não do título.
  - **`toggleArchive`**: ao arquivar (`newIsArchived === true`), chama
    `deleteDocumentEvent(document)` (usa o `document` do `findUnique`, antes do
    update). Ao desarquivar, **decidi também chamar** `syncDocumentEvent(updatedDocument, 'update')`
    quando `updatedDocument.expirationDate` existe — não era exigido explicitamente
    pela tarefa (que só menciona remoção ao arquivar/excluir), mas evita deixar um
    documento reativo sem evento no Google Agenda até a próxima edição manual,
    mantendo o estado do calendário consistente com o ciclo de vida do documento.
  - **`deleteDocument`** (hard delete): confirmado e testado (`callOrder` em teste
    dedicado) que `deleteDocumentEvent(document)` é chamado **antes** de
    `prisma.document.delete(...)`, usando o `document` buscado no início da função
    (antes de qualquer mutação) — necessário porque `GCalSyncLog.onDelete: Cascade`
    apagaria o histórico de sync junto com o documento, e depois disso
    `deleteDocumentEvent` não encontraria mais nada para remover.
  - Todos os 4 pontos envolvem `try/catch` com `console.error` — falha/rejeição do
    `gcalService` nunca vira resposta não-2xx (testado explicitamente com
    `mockRejectedValue` nos 4 handlers).
  - Validação: `npm --prefix backend run build` passa; `npm --prefix backend test`
    passa (185 testes, 11 novos), com a única falha pré-existente e já documentada
    em `notification-gcal.test.ts` › `cronService` › "recalcula documentos ativos..."
    (fixture de data hardcoded, não relacionada a este trabalho).
