---
id: T-260901-cw1oi4
title: "DOC-28 (retorno de QA): gatilho do botao de sync no Calendario deve depender do status de conexao Google"
status: doing
owner: "-"
workflow: bugfix
created: 2026-09-01
links: ["DOC-28"]
---

## Goal
Retorno de QA no DOC-28 (ticket reaberto pelo usuário): na página de Calendário,
o botão "Sincronizar com Agenda" aparece mesmo quando o usuário não tem uma
conta Google conectada. Deve, em vez disso, mostrar um botão "Conectar Google
Agenda" (mesmo texto/fluxo já usado em Configurações) quando não houver
conexão, e só mostrar "Sincronizar com Agenda" quando houver.

## Context
- Comentário do usuário em DOC-28 (Linear) com prints confirmando o
  comportamento atual: `frontend/src/pages/calendar/CalendarPage.tsx` sempre
  renderiza o botão de sync (linhas ~204-213), sem checar
  `googleAuthService.getStatus()`.
- O outro ponto do comentário (`GOOGLE_OAUTH_NOT_CONFIGURED` ao tentar
  conectar) **não é um bug** — é o comportamento correto já implementado
  quando `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI` não estão configurados no
  ambiente (faltam credenciais reais do Google Cloud Console, um passo manual
  fora do escopo deste card — já esclarecido no comentário de resposta).
- Padrão de referência já implementado em
  `frontend/src/pages/settings/SettingsPage.tsx`: `fetchGoogleStatus`
  (chama `googleAuthService.getStatus()`), `handleConnectGoogle` (chama
  `googleAuthService.getConnectUrl()` + `navigateToGoogleConsent`, trata erro
  `GOOGLE_OAUTH_NOT_CONFIGURED` com mensagem amigável), e o botão com ícone
  `Link2` e texto "Conectar Google Agenda".
- Serviço: `frontend/src/features/calendar/services/googleAuthService.ts`
  (`getStatus`, `getConnectUrl`, `navigateToGoogleConsent`).

## Escopo
`frontend/src/pages/calendar/CalendarPage.tsx`:
1. Buscar o status de conexão (`googleAuthService.getStatus()`) ao montar a
   página, guardando em um state (ex.: `isGoogleConnected: boolean | null`,
   `null` = ainda carregando).
2. Renderizar condicionalmente no cabeçalho, no lugar do botão de sync atual:
   - Se `isGoogleConnected === false`: botão "Conectar Google Agenda" (mesmo
     texto/ícone/comportamento de `SettingsPage.tsx`'s `handleConnectGoogle`).
   - Caso contrário (conectado ou ainda carregando): manter o botão
     "Sincronizar com Agenda" existente, sem mudanças de comportamento.
3. Reusar o tratamento de erro já usado em Settings para
   `GOOGLE_OAUTH_NOT_CONFIGURED` ao clicar em conectar a partir do Calendário.

## Fora de escopo
- Configurar credenciais reais do Google Cloud (passo manual do usuário).
- Mudar o redirect do callback OAuth (`/configuracoes?google=...`) — fica
  apontando para Configurações mesmo se a conexão for iniciada pelo
  Calendário; não foi pedido para mudar isso.
- Qualquer mudança de backend.

## Validação
- `npm --prefix frontend run build` e `npm --prefix frontend test` sem
  regressão (28/28 hoje).

## Checklist
- [ ] Status de conexão buscado ao montar CalendarPage
- [ ] Botão condicional implementado (Conectar vs Sincronizar)
- [ ] Build e testes de frontend sem regressão
- [ ] Commit único e descritivo

## Log
- 2026-09-01 — criada a partir do retorno de QA em DOC-28
