---
id: T-260830-bbinpu
title: "DOC-28 (2/5): fluxo de conexão OAuth (endpoints + botão no frontend)"
status: backlog
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
- [ ] Endpoints de connect/callback/status/disconnect implementados e protegidos por
      `authMiddleware`
- [ ] Tokens persistidos em `GoogleOAuthToken` (upsert por usuário)
- [ ] Botão "Conectar Google Agenda" + status no frontend
- [ ] Testes (Vitest/Supertest no backend) cobrindo os novos endpoints com a lib do
      Google mockada — seguir o padrão de mock de `prisma` já usado em
      `backend/tests/notification-gcal.test.ts` (`vi.mock('../src/lib/prisma.js', ...)`)
- [ ] `npm --prefix backend test` e `npm --prefix frontend test` passam
- [ ] Commit único e descritivo, sem push

## Log
- 2026-08-30 — criada a partir da decomposição de DOC-28 (ADR-009)
