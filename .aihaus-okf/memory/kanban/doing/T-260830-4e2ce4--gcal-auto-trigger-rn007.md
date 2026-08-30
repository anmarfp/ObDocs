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
- [ ] `createDocument` dispara sync ao criar documento com vencimento
- [ ] `updateDocument` dispara sync ao alterar a data de vencimento
- [ ] Arquivar/excluir dispara remoção do evento correspondente
- [ ] Falha de sync não bloqueia a resposta HTTP da operação principal
- [ ] Testes cobrindo os 3 gatilhos (mock de `gcalService`, seguindo o padrão de
      `vi.mock` já usado em `backend/tests/notification-gcal.test.ts`)
- [ ] `npm --prefix backend test` passa
- [ ] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
