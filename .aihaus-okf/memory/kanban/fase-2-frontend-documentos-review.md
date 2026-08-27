# Parecer adversarial — Fase 2 Frontend Documentos

**Veredito:** `ship-with-changes` — não iniciar a implementação a partir do plano sem aplicar as correções de contrato abaixo.

## Evidência auditada

- Plano: `memory/kanban/fase-2-frontend-documentos-plan.md`.
- API: `backend/src/routes/documentRoutes.ts:19-43`, `backend/src/controllers/documentController.ts:10-911`, `backend/src/routes/categoryRoutes.ts:6-16` e `backend/prisma/schema.prisma:15-151`.
- Cliente existente: `frontend/src/services/api.ts:5-9` e `frontend/src/pages/DocumentosPage.tsx`.

## Divergências confirmadas

| Severidade | Divergência | Evidência e consequência | Correção obrigatória no frontend |
|---|---|---|---|
| Bloqueante | Prefixo da API duplicado | `api.ts:6` já usa `baseURL: '/api/v1'`; o plano usa `'/api/v1/documents'` e `'/api/v1/categories'` (`plan:388,397,427,...`). Isso requisita `/api/v1/api/v1/...`. | Nos serviços, usar somente `'/documents'`, `'/categories'`, `'/company/config'` e URLs de anexo normalizadas a partir da origem da API. |
| Alta | Paginação e ordenação inexistentes | O DTO do plano declara `page`, `limit`, `sortBy`, `order` (`plan:244-252`) e chama a lista de “paginada”, mas o controlador só lê `categoryId`, `status`, `search`, `includeArchived` (`documentController.ts:265`) e responde apenas `{ documents, total }` (`:323`). | Não exibir controles de página/ordem nem tipar `page/limit` na resposta. Paginação/ordenação requer mudança explícita no backend. |
| Alta | Filtros prometidos não existem | O plano promete responsável, período e protocolo (`plan:17`). A busca real cobre `title`, `issuingBody`, `responsibleName` e `notes` (`documentController.ts:294-299`); não há campo protocolo no schema (`schema.prisma:82-108`). | Implementar apenas busca debounced (nos quatro campos reais), categoria, status e `includeArchived`. Não rotular a busca como “protocolo”; não renderizar filtros de responsável/período sem endpoint novo. |
| Alta | RN-004 não tem fonte de configuração no plano | A UI não consegue deduzir `notificationMode` do usuário autenticado. A API existente é `GET /company/config` (`companyRoutes.ts:8`) e retorna `{ config }` (`companyController.ts:41`). | Criar `companyService.getConfig()` e carregar antes de abrir/submeter o formulário; `ONLY_RESPONSIBLE` torna nome **e** e-mail obrigatórios. |
| Alta | Dependências exigidas não instaladas | O plano requer Zod, React Hook Form e resolvers, mas `frontend/package.json` não lista nenhum deles. | Adicionar `zod`, `react-hook-form` e `@hookform/resolvers` antes de importar esses pacotes, ou implementar validação sem essas bibliotecas (não recomendado). |
| Média | Erros de upload mapeados de forma errada | Limite/tipo inválido retornam `400` com `FILE_TOO_LARGE` e `INVALID_FILE_TYPE`, não `413/LIMIT_FILE_SIZE` (`errorHandler.ts:17-40`). | Mapear os códigos/HTTP reais, preservando `VALIDATION_ERROR`, `RESPONSIBLE_REQUIRED`, `CATEGORY_NOT_FOUND` e `DOCUMENT_NOT_FOUND`. |
| Média | Contrato de categoria não é uniforme | `GET /categories` formata `documentCount` (`categoryController.ts:12-31`); `document.category` é o modelo Prisma bruto, sem esse campo (`documentController.ts:303`). | Manter `documentCount?` opcional e nunca pressupô-lo em `DocumentItem.category`. |
| Média | Regras de formulário divergem do servidor | Plano exige título mínimo 2, `alertLeadDays <=365`, notas até 2000 e vencimento >= emissão; API exige título mínimo 1 e antecedência inteira >=1, e não impõe os demais limites (`documentController.ts:10-72`). | Não anunciar os limites adicionais como contrato da API. Preferencialmente espelhar o servidor e manter só validações UX claramente locais. |
| Média | Troca de status em renovação é incompleta no plano | O backend só honra `status=RENEWAL_IN_PROGRESS`; para sair dele é preciso enviar `isRenewalInProgress=false` (`documentController.ts:477-494`). | Ação “Em renovação” envia ambos `status` e `isRenewalInProgress: true`; ação de encerrar envia `isRenewalInProgress: false` (e não apenas `status: REGULAR`). |
| Média | Endpoint de versões foi listado, mas não especificado no serviço | A API oferece `GET /documents/:id/versions` (`documentRoutes.ts:40`) e retorna `{ documentId, versions }` (`documentController.ts:911`). | Implementar `getDocumentVersions`; detalhes pode usar `document.versions`, mas a atualização após renovação deve refazer detalhes/versões. |

## Riscos do backend que a UI não pode corrigir

1. O hard delete de ADMIN apaga o documento e faz cascade das versões (`documentController.ts:704-713`; `schema.prisma:112-127`), contradizendo a imutabilidade de RN-002. A UI deve ocultar/desabilitar hard delete quando `_count.versions > 0`, mas isso não protege chamadas diretas; é necessário corrigir/decidir no backend.
2. A criação do snapshot de renovação e o update subsequente não estão em transação (`documentController.ts:797-825`). A UI não deve afirmar atomicidade ou “histórico imutável garantido”.
3. O frontend não deve recalcular nem sobrescrever status com base no relógio local: o status retornado pela API é a fonte de verdade. A atualização diária é responsabilidade do backend/cron.

## Prompt executável para o Implementer (Antigravity)

```text
Você implementará a Fase 2 do módulo Documentos do DocsOb em frontend/ (React 18, TypeScript estrito, Vite, Tailwind, Axios). Antes de editar, leia frontend/src/services/api.ts, frontend/src/pages/DocumentosPage.tsx, frontend/src/contexts/AuthContext.tsx, frontend/package.json e os contratos backend/src/routes/documentRoutes.ts, backend/src/controllers/documentController.ts, backend/src/routes/categoryRoutes.ts, backend/src/routes/companyRoutes.ts e backend/prisma/schema.prisma. Não modifique o backend.

Objetivo: substituir o placeholder de /documentos por CRUD de documentos, upload drag-and-drop, filtros suportados, detalhe, versões, auditoria e renovação. Preserve o tema Midnight Navy e o padrão do projeto. Use os aliases @ existentes. Para qualquer <td> com conteúdo flex, mantenha o <td> como célula e ponha o flex dentro de uma <div>.

0. Dependências: instale e registre zod, react-hook-form e @hookform/resolvers. Não introduza React Query nem outra biblioteca de estado.

1. Contrato de URL: api.ts já possui baseURL '/api/v1'. Todos os serviços devem usar caminhos relativos: '/documents', '/categories', '/company/config'. Nunca use '/api/v1/documents'. Para FormData, não force Content-Type; deixe o Axios/browser definir o boundary. O interceptor JWT existente deve continuar sendo usado.

2. Crie frontend/src/features/documents/types/document.types.ts com os enums literais exatos:
   DocumentStatus = EXPIRED | CRITICAL | RENEWAL_IN_PROGRESS | REGULAR | INDETERMINATE;
   AuditAction = CREATE | UPDATE | ARCHIVE | UNARCHIVE | DELETE | RENEW;
   NotificationMode = ALL_ADMINS | ONLY_RESPONSIBLE.
   Modele Document, DocumentVersion, AuditLog, GCalSyncLog, UserSummary e DocumentCategory conforme schema Prisma. Todas as datas recebidas são strings ISO; campos nullable devem ser string | null. DocumentCategory.documentCount é opcional e só deve ser usado na resposta de /categories. A resposta de GET /documents é exatamente { documents, total }; não declare page/limit/sort/order como suportados.

3. Crie documentService e categoryService. Implementar exatamente:
   GET '/documents' com somente query search, categoryId, status, includeArchived;
   GET '/documents/:id' -> data.document;
   GET '/documents/:id/versions' -> data.versions;
   POST '/documents' multipart; PUT '/documents/:id' multipart;
   POST '/documents/:id/renew' multipart;
   PATCH '/documents/:id/archive'; DELETE '/documents/:id'.
   Campo do arquivo é sempre 'attachment'. O serviço de empresa deve chamar GET '/company/config' e devolver data.config. Não implemente paginação, sort, filtro de responsável, período ou protocolo: a API não os possui. Busca só pode ser rotulada como título, órgão emissor, responsável ou observações.

4. FormData: crie helpers que preservem a semântica de update. Para limpar strings/opcionais em PUT, envie '' quando a propriedade tiver sido explicitamente definida como null; para criação, omita opcionais vazios. Envie booleanos como 'true'/'false'. Para entrar em renovação, envie status='RENEWAL_IN_PROGRESS' e isRenewalInProgress='true'. Para sair, envie isRenewalInProgress='false'; status='REGULAR' isolado não funciona no backend. O status exibido é sempre o devolvido pela API; não o recalcule no cliente.

5. RN-004: ao abrir criação/edição, carregue GET '/company/config'. Se notificationMode==='ONLY_RESPONSIBLE', mostre e exija responsibleName e responsibleEmail; se ALL_ADMINS, oculte-os e não os envie. Bloqueie submit enquanto a configuração estiver carregando ou apresente erro recuperável. O backend continua sendo a autoridade e RESPONSBLE_REQUIRED deve aparecer como toast amigável.

6. Upload: criar FileDropzone acessível, operável por teclado e por drag/drop. Aceitar somente application/pdf, image/png, image/jpeg e image/jpg; limite local de 10 * 1024 * 1024. Mostrar nome, tamanho, progresso de onUploadProgress e remoção antes do submit. Também tratar respostas reais: 400 FILE_TOO_LARGE, INVALID_FILE_TYPE, VALIDATION_ERROR, RESPONSIBLE_REQUIRED, CATEGORY_NOT_FOUND, DOCUMENT_NOT_FOUND; 401 é tratado pelo interceptor e 403 deve virar mensagem de permissão.

7. Implementar tabela, filtros e modais: debounce de busca; selects de categoria/status; toggle includeArchived somente se user.role==='ADMIN'. ADMIN com includeArchived=true recebe ativos e arquivados; OPERATIONAL jamais recebe arquivados. Ações: detalhe; editar; renovar; PATCH de arquivar/desarquivar; DELETE somente ADMIN, sempre com confirmação. Por segurança visual, não ofereça hard delete para documento com _count.versions > 0; registre em comentário/nota que a proteção definitiva requer backend.

8. Detalhes vêm de GET '/documents/:id' e devem mostrar metadata, anexo autenticado (não use <a> simples se o Bearer não acompanha; faça download/blob autenticado ou abra URL com mecanismo autenticado), versions, auditLogs e gcalSyncLogs quando existirem. Após renovar, refaça GET detalhe e GET versões. Renovação envia issueDate obrigatório, expirationDate opcional/nulo, notes opcional e attachment opcional. Ela cria snapshot da versão anterior no backend; o frontend não inventa número de versão.

9. Validação: espelhe o mínimo do servidor — title não vazio (até 200), UUID de categoria, issueDate válida, alertLeadDays inteiro >=1, issuingBody até 150, e-mail válido quando fornecido. Se optar pela validação UX adicional de datas (vencimento >= emissão) ou notas/lead limit, deixe claro no código que não é validação do contrato da API. Não bloqueie documentos de prazo indeterminado: envie expirationDate nulo/omitido.

10. Integre em DocumentosPage e App sem quebrar /documentos. Adote componentes pequenos, sem criar a árvore inteira do plano se não houver reutilização real. Cubra com Vitest/RTL: serviço usa URL relativa correta; serialização FormData; FileDropzone recusa tipo/tamanho; RN-004; RBAC de arquivados/delete; e refetch após CRUD/renovação. Rode em frontend: npm run build e npm test. Entregue resumo, arquivos alterados, resultados dos comandos e quaisquer limitações do backend acima.
```

## Critérios revisados

- CRUD, upload, filtros suportados, detalhes, versões, auditoria e renovação: `satisfeito com as correções de contrato`.
- Filtros avançados/paginação/protocolo prometidos: `não satisfeito` pelo backend atual; não implementar como funcionalidade ativa.
- RN-004: `parcial` até integrar `GET /company/config`.
- RN-002: `parcial/bloqueado no backend` para hard delete com histórico.
- Testes/build: `não executados`, pois esta foi uma revisão estática e nenhuma implementação foi realizada.
