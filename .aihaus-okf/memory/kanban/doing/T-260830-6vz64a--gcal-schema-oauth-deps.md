---
id: T-260830-6vz64a
title: "DOC-28 (1/5): dependência googleapis + schema GoogleOAuthToken + env vars"
status: doing
owner: "-"
workflow: feature
created: 2026-08-30
links: ["DOC-28", "ADR-009", "T-260830-bbinpu", "T-260830-hihhvj", "T-260830-4e2ce4", "T-260830-ka1az5"]
---

## Goal
Base fundacional da sincronização real com Google Agenda (DOC-28): dependência do
Google no backend, tabela para persistir tokens OAuth por usuário, e variáveis de
ambiente/credenciais documentadas. Nenhum comportamento de sincronização muda ainda
(gcalService.ts continua simulado até a subtarefa 3) — este card só prepara o terreno.

## Context
- Decisão de arquitetura: `.aihaus-okf/memory/project/decisions.md` ADR-009 (modelo
  OAuth por usuário, aprovado por Marco em 2026-08-30).
- Ticket completo: DOC-28 no Linear (`orca linear issue --id DOC-28 --full --json`).
- Schema atual: `backend/prisma/schema.prisma:144` (`GCalSyncLog`, guarda só o
  resultado da sincronização — não há onde guardar credenciais hoje).
- `User` model em `backend/prisma/schema.prisma:53`.
- `backend/package.json` — hoje sem nenhuma dependência do Google.
- Env vars existentes: `.env.example` (raiz) e `backend/.env.example` (mesmo
  conteúdo, mantidos em sincronia) e `docker-compose.yml:39-50` (serviço `backend`,
  bloco `environment:`).
- Próximas subtarefas (T-260830-bbinpu, T-260830-hihhvj, T-260830-4e2ce4,
  T-260830-ka1az5) dependem desta.

## Escopo
1. Adicionar `googleapis` (preferir sobre `google-auth-library` sozinho, pois já
   inclui o client da Calendar API) a `backend/package.json` (`dependencies`).
2. Nova migration Prisma: tabela `GoogleOAuthToken` — 1 linha por usuário que
   conectou sua conta. Sugestão de shape (ajustar durante implementação conforme
   necessidade real do fluxo OAuth da subtarefa 2):
   - `id`, `userId` (FK única para `User`, 1:1), `accessToken`, `refreshToken`,
     `expiryDate` (DateTime), `scope`, `createdAt`, `updatedAt`.
   - Nomear a migration de forma descritiva (ex.: `add_google_oauth_token`).
   - Rodar via `npm --prefix backend run db:migrate` (requer Postgres local rodando
     — `npm run docker:up` levanta o Postgres via `docker-compose.yml` se precisar).
3. Adicionar ao `.env.example` (raiz) **e** `backend/.env.example` (mantendo os dois
   em sincronia, como já é o padrão hoje): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `GOOGLE_REDIRECT_URI` — com placeholders `changeme_...` seguindo o estilo já usado
   nesses arquivos (ex.: `JWT_SECRET="changeme_use_a_long_random_secret_value"`).
4. Adicionar as mesmas 3 variáveis ao serviço `backend` em `docker-compose.yml`
   (bloco `environment:`, seguindo o padrão `${VAR:-default}` já usado para
   `JWT_SECRET` etc. — usar string vazia como default, já que não há valor seguro
   de fallback para credenciais OAuth reais).
5. **Não** implementar o fluxo OAuth em si nem tocar em `gcalService.ts` — isso é
   escopo das subtarefas 2 e 3.

## Fora de escopo
- Criar o projeto/credenciais reais no Google Cloud Console — isso é uma ação
  manual do usuário fora do repositório; só cabe aqui documentar as variáveis.
- Qualquer mudança em `gcalService.ts`, `calendarController.ts`, frontend.

## Checklist
- [x] `googleapis` adicionado a `backend/package.json`, `npm install` rodado
- [x] Migration Prisma criada para `GoogleOAuthToken` e aplicada localmente
- [x] `.env.example` e `backend/.env.example` atualizados com as 3 variáveis Google
- [x] `docker-compose.yml` (serviço `backend`) atualizado com as mesmas variáveis
- [x] `npm --prefix backend run build` (typecheck) passa
- [x] `npm --prefix backend test` (suíte existente, sem regressão) passa
- [x] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
- 2026-08-30 — Implementada a subtarefa 1/5: adicionado `googleapis@^176.0.0` a
  `backend/package.json` (+ `npm install`, gera `package-lock.json`); novo model
  Prisma `GoogleOAuthToken` (relação 1:1 com `User`, FK única `userId`, campos
  `accessToken`/`refreshToken`/`expiryDate`/`scope`/`createdAt`/`updatedAt`) com
  migration `20260830192802_add_google_oauth_token` aplicada com sucesso no
  Postgres local (`prisma migrate status` confirma "up to date"); adicionadas
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` a `.env.example`,
  `backend/.env.example` (placeholders `changeme_...`) e ao serviço `backend` em
  `docker-compose.yml` (padrão `${VAR:-}`). `npm --prefix backend run build` passa
  sem erros. `npm --prefix backend test`: 142/143 testes passam; a única falha
  (`tests/notification-gcal.test.ts` › cronService › recalcula documentos ativos...)
  é um bug pré-existente e não relacionado — o teste hardcoda
  `expirationDate: 2026-08-30` sem congelar o relógio do sistema (sem
  `vi.setSystemTime`), e a data real de hoje é 2026-08-30, então o documento que o
  teste espera como CRITICAL já é calculado como EXPIRED. Confirmado via
  `git stash` (reverte para o código antes desta subtarefa) que o mesmo teste falha
  exatamente da mesma forma sem nenhuma das mudanças desta subtarefa — não é uma
  regressão introduzida aqui. Nenhum arquivo fora do escopo (`gcalService.ts`,
  `calendarController.ts`, frontend) foi tocado.
