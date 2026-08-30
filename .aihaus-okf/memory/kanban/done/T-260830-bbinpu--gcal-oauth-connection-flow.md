---
id: T-260830-bbinpu
title: "DOC-28 (2/5): fluxo de conexão OAuth (endpoints + botão no frontend)"
status: done
owner: "-"
workflow: feature
created: 2026-08-30
links: ["DOC-28", "ADR-009", "T-260830-6vz64a", "T-260830-hihhvj"]
---

## Goal
Permitir que um administrador conecte sua própria conta Google ao DocsOb (modelo
OAuth por usuário — ADR-009): endpoints de redirect/callback no backend + um botão
"Conectar Google Agenda" no frontend com indicação de status da conexão. Ainda não
sincroniza nada de verdade (isso é a subtarefa 3) — só estabelece e persiste a
credencial.

## Pré-requisito
Depende de T-260830-6vz64a (dependência `googleapis`, tabela `GoogleOAuthToken`,
env vars) já mesclado em `main`.

## Context
- ADR-009 em `.aihaus-okf/memory/project/decisions.md`.
- Rotas de calendário hoje: `backend/src/routes/calendarRoutes.ts` (todas atrás de
  `authMiddleware`; `requireRole([Role.ADMIN])` já usado para `/sync-logs`).
- Controller: `backend/src/controllers/calendarController.ts`.
- Autenticação existente: `backend/src/middlewares/auth.ts` (`AuthenticatedRequest`
  com `req.user.userId`), `backend/src/utils/jwt.ts`.
- Tabela `GoogleOAuthToken` (criada na subtarefa 1) — persistir aqui.
- Frontend: `frontend/src/pages/settings/SettingsPage.tsx` (página de Configurações,
  hoje com seções de Política de Notificação e Rotinas Administrativas — usar o
  mesmo padrão visual de card `bg-white rounded-2xl border ... shadow-card p-6`) e
  `frontend/src/pages/calendar/CalendarPage.tsx` (tem o banner "Sincronização
  Simulada / Local" em `CalendarPage.tsx:218-224`, que só será removido na
  subtarefa 5). Decidir com qual página faz mais sentido colocar o botão de conexão
  (Configurações parece mais coerente por ser uma credencial de integração, não uma
  ação do dia a dia) — usar juízo de implementação.
- Serviço de API do frontend: `frontend/src/features/calendar/services/calendarService.ts`
  (padrão de chamada via `api` de `@/services/api`).

## Escopo
1. Biblioteca Google: usar `google.auth.OAuth2` (`googleapis`) para gerar a URL de
   autorização e trocar o `code` pelo token no callback.
2. Endpoints novos (nomear/organizar como fizer mais sentido, ex. em
   `calendarRoutes.ts` ou um novo `googleAuthRoutes.ts` — decidir e documentar):
   - `GET /calendar/google/connect` (ADMIN e OPERATIONAL, autenticado) → retorna/
     redireciona para a URL de consentimento do Google, passando o `userId`
     autenticado como `state` (assinado/verificável, para não confiar em `state`
     não autenticado no callback).
   - `GET /calendar/google/callback` → troca `code` por tokens, persiste em
     `GoogleOAuthToken` (upsert por `userId`), redireciona de volta ao frontend
     (Configurações) com sucesso/erro.
   - `GET /calendar/google/status` → retorna se o usuário autenticado tem uma
     conexão ativa (sem vazar o token).
   - `DELETE /calendar/google/status` (ou `/disconnect`) → revoga/remove o token
     local (tratar erro de revogação junto ao Google como não-bloqueante: sempre
     remover localmente).
3. Frontend: botão "Conectar Google Agenda" (com estado: desconectado / conectado /
   conectando) + ação de desconectar. Seguir o padrão de toasts já usado
   (`useToast`, `ToastContainer`) e o service layer (`calendarService.ts` ou um novo
   `googleAuthService.ts`).
4. Tratar erro de configuração ausente (`GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI`
   vazios) com mensagem clara em vez de exceção não tratada.

## Fora de escopo
- Reescrever `gcalService.ts` para usar os tokens de fato (subtarefa 3).
- Remover o banner de simulação (subtarefa 5).

## Checklist
- [x] Endpoints de connect/callback/status/disconnect implementados e protegidos por
      `authMiddleware` (exceto o `callback`, deliberadamente público — ver Log)
- [x] Tokens persistidos em `GoogleOAuthToken` (upsert por usuário)
- [x] Botão "Conectar Google Agenda" + status no frontend
- [x] Testes (Vitest/Supertest no backend) cobrindo os novos endpoints com a lib do
      Google mockada — seguir o padrão de mock de `prisma` já usado em
      `backend/tests/notification-gcal.test.ts` (`vi.mock('../src/lib/prisma.js', ...)`)
- [x] `npm --prefix backend test` e `npm --prefix frontend test` passam
- [x] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
- 2026-08-30 — Implementado o fluxo de conexão OAuth (subtarefa 2/5 de DOC-28):
  - **Backend**: novo `backend/src/controllers/googleAuthController.ts` com os 4
    handlers; rotas adicionadas em `backend/src/routes/calendarRoutes.ts`:
    - `GET /calendar/google/connect` (`authMiddleware`, ADMIN e OPERATIONAL — os
      dois únicos papéis existentes no sistema): gera a URL de consentimento
      (`generateAuthUrl` com `access_type: 'offline'`, `prompt: 'consent'`,
      `scope: ['https://www.googleapis.com/auth/calendar.events']`) e a retorna
      como JSON `{ url }` — **não** redireciona a partir do backend. Decisão:
      como o endpoint exige `Authorization: Bearer` e uma navegação de página
      inteira do navegador não consegue enviar esse header, o frontend chama
      este endpoint via XHR autenticado (`api.get`) para obter a URL do Google
      e só então faz `window.location.href = url` — a navegação de página
      inteira acontece para o domínio do Google, não para o nosso backend. Um
      redirect 302 direto do backend exigiria aceitar o JWT via query string
      (vazamento em logs) ou tornar o endpoint público (perderia a verificação
      de papel), então JSON+navegação client-side é a opção mais simples e
      correta.
    - `GET /calendar/google/callback` (**sem** `authMiddleware` — é o navegador
      do usuário sendo redirecionado pelo Google, não pode carregar um Bearer
      token). A rota é registrada no `calendarRouter` **antes** da chamada
      `calendarRouter.use(authMiddleware)`, então o Express nunca aplica o
      middleware a ela (ordem de registro). A autenticidade é garantida pelo
      `state`: assinado com `generateToken`/verificado com `verifyToken`
      (mesmas funções de `backend/src/utils/jwt.ts`, sem novo mecanismo de
      assinatura) carregando o `userId` do usuário que iniciou o `/connect`.
      Troca o `code` por tokens via `oauth2Client.getToken(code)` e faz upsert
      em `GoogleOAuthToken` por `userId` (na reconexão, preserva o
      `refreshToken` existente se o Google não devolver um novo). Sempre
      redireciona para `${FRONTEND_URL}/configuracoes?google=connected` ou
      `?google=error` (nunca deixa uma exceção não tratada estourar).
    - `GET /calendar/google/status` (`authMiddleware`): `{ connected: boolean }`,
      nunca expõe os valores do token.
    - `DELETE /calendar/google/status` (`authMiddleware`): remove o
      `GoogleOAuthToken` do usuário; tenta `oauth2Client.revokeToken(...)` em
      melhor esforço (erro de revogação é logado e ignorado — a remoção local
      sempre acontece).
    - `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI` ausentes → `/connect` responde
      `503 { error: 'GOOGLE_OAUTH_NOT_CONFIGURED' }` em vez de estourar.
    - Nova env var `FRONTEND_URL` (padrão `http://localhost:5173`) adicionada em
      `.env.example`, `backend/.env.example` e `docker-compose.yml` (serviço
      `backend`, mesmo padrão `${VAR:-default}`).
  - **Testes**: `backend/tests/google-auth.test.ts` (16 testes) — `googleapis`
    mockado (`vi.mock('googleapis', ...)`, com `OAuth2` implementado como
    `function` de verdade, não arrow function, já que o controller usa `new
    google.auth.OAuth2(...)` e arrow functions não são construtíveis) e
    `prisma` mockado no mesmo padrão de `notification-gcal.test.ts`. Cobre:
    401/503/200 e state assinado em `/connect` (ADMIN e OPERATIONAL); `/callback`
    com state ausente/inválido, criação, reconexão preservando refreshToken, e
    falha na troca do code; `/status` conectado/desconectado; `DELETE /status`
    revogando com sucesso, revogação falhando (não bloqueante) e sem conexão
    para remover.
  - **Bug real encontrado e corrigido durante os testes**: `generateToken`
    lançava `Bad "options.expiresIn" option the payload already has an "exp"
    property` porque `req.user` (payload já decodificado pelo `authMiddleware`)
    carrega `iat`/`exp` do JWT original — corrigido reconstruindo um payload
    limpo (`{ userId, email, role, name }`) antes de assinar o `state`.
  - **Frontend**: `frontend/src/features/calendar/services/googleAuthService.ts`
    (novo — `getStatus`, `disconnect`, `getConnectUrl`, todos via `api`) mais um
    helper puro `navigateToGoogleConsent(url)` (não é uma chamada de API, só
    `window.location.href = url`) — a divisão reflete a pergunta do escopo
    sobre "service" vs. "helper/constante" para a URL de conexão. Nova seção
    "Conectar Google Agenda" em `frontend/src/pages/settings/SettingsPage.tsx`
    (mesmo padrão visual de card), com estados carregando/conectado (botão
    "Desconectar")/desconectado (botão "Conectar Google Agenda"). Trata
    `?google=connected`/`?google=error` via `useSearchParams` (toast +
    refetch do status + limpeza do parâmetro da URL).
  - Ajuste necessário em teste pré-existente: `frontend/tests/users-settings.test.tsx`
    renderizava `<SettingsPage />` sem `<MemoryRouter>`; como a página agora usa
    `useSearchParams`, isso quebrava. Envolvido em `<MemoryRouter>` (mesmo padrão
    de `renderWithAuth` já usado no arquivo) e adicionado
    `vi.spyOn(googleAuthService, 'getStatus')` para manter o teste determinístico.
  - **Validação**: `npm --prefix backend run build` OK; `npm --prefix backend test`
    → 159 testes, 1 falha (a já documentada `notification-gcal.test.ts` › `cronService`
    › "recalcula documentos ativos..." por data fixa na fixture colidindo com a
    data real — não relacionada a este trabalho); `npm --prefix frontend run build`
    OK; `npm --prefix frontend test` → 28/28 passando.
  - Não tocado: `gcalService.ts`, `documentController.ts`, banner de simulação em
    `CalendarPage.tsx` (fora de escopo desta subtarefa).
- 2026-08-30 — Revisão do orquestrador antes do merge: o `state` OAuth estava
  sendo assinado com `generateToken` (o mesmo gerador do token de login
  completo, válido por `JWT_EXPIRES_IN`/7 dias, com email/role/name). Como
  `state` trafega em canais baseados em URL (query string, logs de acesso do
  Google e do próprio servidor, histórico do navegador) muito mais expostos
  que um header `Authorization`, isso tornava um `state` vazado equivalente a
  um token de API totalmente privilegiado por dias. Corrigido com
  `signOAuthState`/`verifyOAuthState` dedicados em `backend/src/utils/jwt.ts`
  (payload reduzido a `{userId, purpose}`, expira em 10 minutos). Testes
  atualizados para usar as novas funções + novo teste provando que um token de
  login normal é rejeitado como `state`. `npm --prefix backend test`: 159/160
  (mesma falha pré-existente e não relacionada de `notification-gcal.test.ts`).
- 2026-08-30 — Revisado e mesclado pelo orquestrador: PR #4 mesclada em `main`
  (`d054163`), branch remota e worktree encerradas. `npm --prefix backend test`
  re-executado em `main` pós-merge: 159/160 (mesma falha pré-existente).
