# Parecer adversarial — Fase 3 Frontend

**Data:** 2026-08-27  
**Reviewer:** Codex (`review-careful`)  
**Veredito:** `ship-with-changes`

O plano não deve ser executado literalmente. Ele contém rotas inválidas, DTOs que não correspondem às respostas reais e funcionalidades que o backend atual não oferece. O prompt canônico ao final corrige o contrato para permitir a implementação do frontend, mantendo explícitos dois gaps de backend: distribuição por categoria incorreta e sincronização Google apenas simulada.

## Escopo e evidência

- Plano auditado: `.aihaus-okf/memory/kanban/fase-3-frontend-plan.md`.
- Montagem real das APIs: `backend/src/app.ts:37-46`.
- Contratos confirmados diretamente nos controllers, routes, services e `backend/prisma/schema.prisma`.
- Frontend-base confirmado em `frontend/src/services/api.ts`, `frontend/src/App.tsx`, `frontend/src/components/auth/ProtectedRoute.tsx` e nas páginas atualmente usadas pelo router.
- O índice de código estava `STALE`; nenhum resultado do índice foi tratado como evidência.
- `git pull origin main`: concluído por fast-forward em `dcb30c0`.

## Achados confirmados

| Severidade | Achado | Evidência / reprodução | Diretriz |
|---|---|---|---|
| Bloqueante | Todos os exemplos Axios duplicam `/api/v1` | `frontend/src/services/api.ts:7-10` já define `baseURL=/api/v1`; o plano usa `/api/v1/...` em `fase-3-frontend-plan.md:374-499`. A URL resultante fica `/api/v1/api/v1/...`. | Usar apenas paths relativos ao base: `/dashboard/metrics`, `/reports/...`, etc. |
| Bloqueante | Rota de auditoria incorreta | O plano usa `/api/v1/audit` (`:431,436`), mas a API é montada em `/api/v1/audit-logs` (`backend/src/app.ts:42`; `auditRoutes.ts:12-13`). | Usar `/audit-logs` e `/audit-logs/:id`. |
| Alta | DTO do resumo executivo é fictício | O plano declara `activeDocuments`, `archivedDocuments`, contagens avulsas, `compliancePercentage` e `generatedAt` (`:151-161`). A resposta real é `{ totalDocuments, complianceRate, statusCounts }` (`reportService.ts:73-76,101-105`). | Substituir por `SummaryReport` real; não renderizar campos inexistentes. |
| Alta | DTO de sync manual é incompatível | O plano espera `{ totalActive, synced, errors, message }` (`:197-201`). O backend retorna somente `{ total, synced }` (`gcalService.ts:11-14,77-80`). | Tipar e exibir `total` e `synced`; não inventar erros/mensagem. |
| Alta | DTO de recálculo é incompatível | O plano espera `{ message, totalUpdated, statusChanges }` (`:346-354`). A resposta é `{ totalProcessed, updatedCount, alertsSent }` (`cronService.ts:10-13,73-77`). | Corrigir o tipo e o toast/resumo visual. |
| Alta | DTO de digest é incompatível | O plano espera `{ message, recipientsCount, itemsIncluded }` (`:356-359`). A resposta real contém `success`, `recipients`, `subject`, `total`, `summary` e `sentAt` (`notificationService.ts:40-53,125-133`). | Modelar `DailyDigestResult`; exibir contagem derivada de `recipients.length` somente na UI. |
| Alta | Métrica `byCategory` não representa todos os documentos | O service conta apenas `upcomingExpirations` dos próximos 30 dias (`dashboardService.ts:86-115`), apesar de anunciar distribuição geral. | Frontend deve exibir o dado como recebido e rotular “Próximos 30 dias”, ou o backend deve ser corrigido antes de rotular “Distribuição por categoria”. Não mascarar o bug. |
| Alta | Integração Google é simulada | `gcalService.ts:40-47` fabrica `gcal-event-${doc.id}` e só grava log; não chama Google API. | Não declarar sincronização Google real/ativa. Exibir “sincronização simulada/local” até o backend integrar Google. TC-F3-04 e DoD 4 não podem passar como integração real. |
| Alta | Central de notificações não possui endpoint de feed | `/notifications` oferece apenas POST administrativos de recálculo e digest (`notificationRoutes.ts:10-14`). | Para o MVP, derivar badge/feed com `GET /documents?status=CRITICAL` e `GET /documents?status=EXPIRED`; não prometer tempo real, lido/não lido ou persistência. |
| Média | Plano conta 16 rotas, mas há 17 | Dashboard 1 + reports 2 + calendar 3 + audit 2 + users 5 + company 2 + notifications 2 = 17. | Critério de aceite deve listar e testar as 17 rotas. |
| Média | “CRUD completo” de usuário não existe | Há GET, POST, PUT e dois PATCH, mas nenhum DELETE (`userRoutes.ts:18-22`). | Implementar gestão sem exclusão: criar, editar, ativar/inativar e redefinir senha. Não criar botão Delete. |
| Média | Auto-toggle é totalmente bloqueado | O controller retorna `CANNOT_DEACTIVATE_SELF` antes de consultar o estado (`userController.ts:159-169`), portanto o próprio usuário não pode nem ativar nem inativar via toggle. | Desabilitar o toggle do usuário autenticado e explicar a restrição; não descrevê-la apenas como auto-inativação. |
| Média | `diffData` está tipado de forma rígida demais | O plano exige `{ old, new }` obrigatórios (`:237`), mas logs reais podem omitir um lado e o Prisma permite JSON arbitrário; CREATE/DELETE são exemplos. | Usar `Record<string, { old?: unknown; new?: unknown } | unknown>` e um renderer defensivo. |
| Média | Busca de auditoria é limitada | `search` filtra somente `userName` (`auditController.ts:62-66`), não documento nem conteúdo do diff. | Rotular como “buscar por autor”; filtros reais são `documentId`, `userId`, `action`, datas, page e limit. |
| Média | Data final de auditoria pode excluir o dia | `endDate` vira `new Date(endDate)` e é usado como `lte` (`auditController.ts:55-59`). `YYYY-MM-DD` representa o início do dia. | Ao usar input de data, enviar fim do dia em ISO para filtro inclusivo. |
| Média | Download CSV está incompleto | O plano retorna só o Blob e perde o header (`:383-394`). O backend envia `Content-Disposition` com filename (`reportController.ts:89-93`). | Retornar resposta/metadata, extrair filename, usar `URL.createObjectURL`, `<a download>`, remover link e revogar URL em `finally`; aplicar fallback quando header não estiver exposto por CORS. |
| Média | Arquivos backend citados no prompt não existem | Não existem `calendarService.ts`, `auditService.ts`, `userService.ts` nem `companyService.ts` no backend; os controllers acessam Prisma diretamente. O serviço de calendário existente chama-se `gcalService.ts`. | Usar controllers/routes e os services realmente existentes como verdade. |
| Média | Plano aponta para páginas/componentes paralelos | O router usa `frontend/src/pages/dashboard/DashboardPage.tsx`, `calendar/CalendarPage.tsx`, `audit/AuditPage.tsx`, `users/UsersPage.tsx` e `settings/SettingsPage.tsx` (`App.tsx:9-15,30-40`). Há páginas legadas homônimas na raiz. | Editar somente as páginas importadas por `App.tsx`; não construir uma segunda árvore. Reutilizar `ProtectedRoute allowedRoles`, não criar `AdminRoute`. |
| Média | Dependência de gráficos ausente | Nem Recharts nem Chart.js está em `frontend/package.json:13-23`. | Escolher uma única biblioteca; o prompt fixa `recharts` para limitar complexidade e atualizar lockfile. |

## Matriz dos contratos reais

| Método e path relativo ao `baseURL` | RBAC | Resposta principal |
|---|---|---|
| `GET /dashboard/metrics` | autenticado | `DashboardMetrics` |
| `GET /reports/export` | autenticado; arquivados só ADMIN | CSV blob ou `{ documents, total }` |
| `GET /reports/summary` | autenticado; arquivados só ADMIN | `{ totalDocuments, complianceRate, statusCounts }` |
| `GET /calendar/events` | autenticado | `{ events }` |
| `POST /calendar/sync` | autenticado | `{ total, synced }` |
| `GET /calendar/sync-logs` | ADMIN | paginação + `logs` |
| `GET /audit-logs` | ADMIN | paginação + `logs` |
| `GET /audit-logs/:id` | ADMIN | `{ log }` ou `404 AUDIT_LOG_NOT_FOUND` |
| `GET /users` | ADMIN | `{ users }` |
| `POST /users` | ADMIN | `{ message, user }` |
| `PUT /users/:id` | ADMIN | `{ message, user }` |
| `PATCH /users/:id/status` | ADMIN | `{ message, user }` |
| `PATCH /users/:id/password` | ADMIN | `{ message }` |
| `GET /company/config` | autenticado | `{ config }` |
| `PUT /company/config` | ADMIN | `{ message, config }` |
| `POST /notifications/recalculate` | ADMIN | `{ totalProcessed, updatedCount, alertsSent }` |
| `POST /notifications/digest` | ADMIN | `DailyDigestResult` |

## Critérios do plano

- Tipos e rotas estritamente aderentes ao backend: `not_satisfied` — paths e quatro DTOs centrais divergem.
- Dashboard e gráficos: `partial` — métricas existem, mas `byCategory` tem semântica limitada/defeituosa.
- CSV/JSON: `partial` — endpoint existe; download proposto não preserva filename.
- Calendário e sync: `partial` — calendário/logs existem; Google real não existe.
- Auditoria Admin com diff: `partial` — API existe, mas path e tipo de diff do plano estão errados.
- Usuários: `partial` — fluxos suportados existem, mas não há DELETE/CRUD completo.
- Configurações RN-004: `partial` — endpoint existe; DTOs das ações do sistema estão errados.
- Central de notificações: `not_satisfied` como feed real; possível derivação limitada pela lista de documentos.
- RBAC: `satisfied` no backend e no router-base; precisa ser preservado nas ações visuais.

## Verificação executada

- `git pull origin main`: PASS, fast-forward para `dcb30c0`.
- `node .aihaus-okf/tools/index.mjs status`: índice `STALE`, portanto descartado como fonte de verdade.
- `npm.cmd test` em backend: não executado por ausência de `node_modules` (`vitest` não encontrado).
- `npm.cmd run build` e `npm.cmd test` em frontend: não executados por ausência de `node_modules` (`tsc`/`vitest` não encontrados).
- Nenhuma alteração de código de produção foi feita nesta revisão.

## Prompt canônico para o Implementer (Antigravity)

```text
Você é o IMPLEMENTER da Fase 3 do frontend DocsOb. Implemente Dashboard, Relatórios, Calendário, Auditoria, Usuários, Configurações e o feed limitado do Header estritamente contra os contratos reais do backend. Não altere o backend nesta tarefa e não afirme que funcionalidades ausentes estão prontas.

LEITURA OBRIGATÓRIA
1. Leia frontend/src/services/api.ts, frontend/src/App.tsx, frontend/src/components/auth/ProtectedRoute.tsx, frontend/src/components/layout/Header.tsx, frontend/src/types/index.ts, frontend/src/types/auth.ts e frontend/src/features/documents/{types,services}/.
2. Leia backend/src/app.ts e todas as routes/controllers de dashboard, report, calendar, audit, user, company e notification; leia ainda dashboardService.ts, reportService.ts, gcalService.ts, cronService.ts, notificationService.ts e schema.prisma.
3. Edite as páginas realmente importadas por App.tsx: pages/dashboard/DashboardPage.tsx, pages/calendar/CalendarPage.tsx, pages/audit/AuditPage.tsx, pages/users/UsersPage.tsx e pages/settings/SettingsPage.tsx. Ignore as páginas legadas homônimas diretamente em pages/.

REGRAS GLOBAIS
- api.ts já tem baseURL '/api/v1'. Use somente paths como '/dashboard/metrics'; jamais '/api/v1/dashboard/metrics'.
- Reutilize o ProtectedRoute atual com allowedRoles={['ADMIN']} e as proteções já presentes no App.tsx. Não crie AdminRoute concorrente.
- Reutilize Role, DocumentStatus, AuditAction, NotificationMode, Document e CompanyConfig já existentes. Elimine/renomeie a interface DashboardMetrics obsoleta em frontend/src/types/index.ts para haver uma única fonte de tipos.
- Não use any. Para JSON arbitrário use unknown e narrowing.
- Preserve a paleta/tokens Tailwind Midnight Navy. Em tabelas, nunca aplique flex diretamente a <td>; use uma <div> interna.
- Cada módulo deve ter skeleton, empty state, erro recuperável com retry e toast. Preserve o interceptor global de 401. Trate localmente 400, 403, 404, 409 e 500 com a mensagem da API quando segura.
- Instale somente recharts para os gráficos e atualize package.json/package-lock.json.

CONTRATOS EXATOS
Crie tipos sem campos inventados:
- DashboardMetrics: statusCounts: Record<DocumentStatus, number>; totalActive:number; totalArchived:number; complianceRate:number; byCategory:{categoryId:string;categoryName:string;colorHex:string|null;count:number}[]; upcomingExpirations: UpcomingExpirationDocument[]. O backend retorna documentos Prisma completos com category.
- SummaryReport: { totalDocuments:number; complianceRate:number; statusCounts:Record<DocumentStatus,number> }.
- CalendarSyncResult: { total:number; synced:number }.
- RecalculateStatusesResult: { totalProcessed:number; updatedCount:number; alertsSent:number }.
- DailyDigestResult: { success:boolean; recipients:string[]; subject:string; total:number; summary:{critical:Document[];expired:Document[];total:number}; sentAt:string }.
- AuditLogItem.diffData: Record<string, {old?:unknown;new?:unknown}|unknown>.
- UserItem deve suportar respostas parciais por operação: createdAt e updatedAt opcionais no tipo de mutação; a listagem traz ambos.

Implemente exatamente as 17 integrações, todas com paths relativos:
GET /dashboard/metrics
GET /reports/export
GET /reports/summary
GET /calendar/events
POST /calendar/sync
GET /calendar/sync-logs (ADMIN)
GET /audit-logs (ADMIN)
GET /audit-logs/:id (ADMIN)
GET /users (ADMIN)
POST /users (ADMIN)
PUT /users/:id (ADMIN)
PATCH /users/:id/status (ADMIN)
PATCH /users/:id/password (ADMIN)
GET /company/config
PUT /company/config (ADMIN)
POST /notifications/recalculate (ADMIN)
POST /notifications/digest (ADMIN)

DASHBOARD E RELATÓRIOS
- Substitua todos os números hardcoded por GET /dashboard/metrics. Renderize os cinco status, totalActive e complianceRate. Mostre totalArchived somente para ADMIN; para OPERATIONAL não mostre nem um card com zero.
- Faça cards clicáveis apontarem para /documentos com comportamento coerente; não invente query se a página não a consumir.
- Use Recharts de forma responsiva e acessível. O gráfico de status usa statusCounts.
- O byCategory do backend conta hoje apenas próximos vencimentos em 30 dias. Rotule o gráfico explicitamente como “Próximos vencimentos por categoria (30 dias)”; registre a limitação, não o apresente como distribuição total.
- GET /reports/summary retorna somente SummaryReport real.
- Export JSON retorna {documents,total}. Export CSV deve usar responseType:'blob', ler response.headers['content-disposition'], extrair filename (com fallback relatorio-documentos-YYYY-MM-DD.csv), criar URL temporária, clicar em <a download>, remover o elemento e chamar URL.revokeObjectURL em finally. Se Content-Disposition não estiver exposto por CORS, use o fallback. Para erros recebidos como Blob, tente decodificar JSON antes de mostrar toast.
- Filtros do relatório são format, status, categoryId, startDate, endDate e includeArchived. includeArchived é visível/enviado somente para ADMIN. startDate/endDate filtram expirationDate.

CALENDÁRIO
- GET /calendar/events aceita month 1..12 e year 1970..2100. Sempre envie month e year juntos para a visão mensal; month isolado é ignorado pelo backend.
- Renderize grade mensal responsiva e eventos pelo dia de expirationDate sem deslocamento de timezone; derive YYYY-MM-DD da string de API antes de montar a célula.
- POST /calendar/sync é permitido a ADMIN e OPERATIONAL e retorna apenas total/synced. Mostre loading e toast baseado nesses dois números.
- O backend simula Google Calendar e fabrica IDs locais. A UI deve dizer “Sincronização simulada/local”; não mostrar “Google conectado/ativo” como fato.
- GET /calendar/sync-logs e o botão/modal de logs aparecem somente para ADMIN. Resposta: {total,page,limit,totalPages,logs}; limit máximo 100.

AUDITORIA
- Módulo e rotas são ADMIN-only. O endpoint correto é /audit-logs, nunca /audit.
- Filtros reais: page, limit, documentId, userId, action, startDate, endDate, search. Rotule search como busca por autor, pois o backend pesquisa apenas userName.
- Para filtro inclusivo de endDate vindo de <input type=date>, envie o fim do dia em ISO; não envie apenas YYYY-MM-DD à meia-noite.
- Monte paginação server-side pelos campos da resposta. O diff viewer deve suportar old ausente, new ausente, null, objetos e valores primitivos; nunca chame JSON.stringify sem fallback visual. Trate 404 AUDIT_LOG_NOT_FOUND.
- O botão “Exportar logs” deve ser removido/desabilitado com explicação, pois não existe endpoint de exportação de auditoria.

USUÁRIOS
- O backend não possui DELETE. Implemente somente listar, criar, editar nome/e-mail/role, ativar/inativar e redefinir senha; não chame isso de exclusão ou CRUD completo.
- Validações: nome mínimo 2, e-mail válido, senha mínima 6, role ADMIN|OPERATIONAL. Trate 409 EMAIL_ALREADY_EXISTS, 404 USER_NOT_FOUND e 400 CANNOT_DEACTIVATE_SELF.
- Desabilite o toggle do usuário autenticado, porque o backend bloqueia qualquer toggle no próprio ID. Use diálogo de confirmação para outros usuários.
- Nunca mostre, armazene ou faça log da senha; limpe o formulário após sucesso/fechamento.

CONFIGURAÇÕES E AÇÕES ADMIN
- Reutilize/extraia o companyService existente de features/documents para evitar duas implementações divergentes. GET /company/config pode ser lido por autenticados; a página de configurações e PUT continuam ADMIN-only.
- Alterar ALL_ADMINS/ONLY_RESPONSIBLE deve atualizar a configuração e invalidar/recarregar qualquer cache usado pelo formulário de documentos da Fase 2.
- Recalcular: mostrar totalProcessed, updatedCount, alertsSent.
- Digest: mostrar success, total e recipients.length; os destinatários são dados sensíveis, portanto não listar e-mails desnecessariamente.
- Use confirmação antes das duas ações manuais e impeça double-submit.

HEADER / NOTIFICAÇÕES
- Não existe endpoint de feed/notificações lidas. Para o MVP, use documentService.getDocuments em paralelo com status CRITICAL e EXPIRED, derive count e mostre uma amostra com links para /documentos. Rotule como “Pendências”, não “notificações em tempo real”.
- Remova dados hardcoded atuais do Header. Não implemente estado lido/não lido, polling agressivo ou WebSocket sem backend.

RBAC E SEGURANÇA VISUAL
- /auditoria, /usuarios e /configuracoes permanecem sob ProtectedRoute ADMIN e ocultos na Sidebar para OPERATIONAL.
- totalArchived, includeArchived e logs de sync são ocultos para OPERATIONAL. Mesmo assim, trate 403 em cada serviço/tela: ocultar botão não substitui autorização do backend.
- Dashboard, relatórios sem arquivados, calendário, sync manual e GET company/config permanecem disponíveis a ambos os papéis.

TESTES OBRIGATÓRIOS
- Serviços: todos os 17 paths relativos, parâmetros e DTOs; assert explícito de que não há '/api/v1/api/v1'.
- CSV: responseType blob, filename de Content-Disposition, fallback, createObjectURL, click e revokeObjectURL; erro JSON encapsulado em Blob.
- RBAC: rotas admin, sidebar, archived count/includeArchived, sync logs e ações de configuração.
- Dashboard: métricas reais, skeleton, erro, vazio e rótulo correto de byCategory.
- Calendário: month/year, timezone/data, sync result e logs ADMIN.
- Auditoria: paginação, busca por autor, endDate inclusiva e diff parcial/arbitrário.
- Usuários: validações, 409, self-toggle, mutações e ausência de delete.
- Configurações: update RN-004, recalculate e digest com campos reais.
- Header: substituição dos mocks por pendências derivadas.

VERIFICAÇÃO E ENTREGA
1. Instale dependências de modo reprodutível.
2. Rode npm run build e npm test dentro de frontend/.
3. Não marque integração Google real, exportação de auditoria nem feed persistente como concluídos.
4. Entregue resumo de arquivos alterados, resultados literais dos comandos e gaps de backend: byCategory limitado aos próximos 30 dias, gcal simulado e ausência de feed/delete/export de auditoria.
```

## Handoff

O Implementer pode iniciar usando exclusivamente o prompt canônico acima. Se o produto exigir “Google Agenda real”, “distribuição por categoria de todos os ativos”, exportação da auditoria ou notificações persistentes, abrir tarefa de backend antes de aceitar esses critérios.
