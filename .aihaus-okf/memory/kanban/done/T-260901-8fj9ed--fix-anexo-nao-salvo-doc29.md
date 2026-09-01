---
id: T-260901-8fj9ed
title: "DOC-29: corrigir anexo (PDF/imagem) nao salvo ao cadastrar/editar documento"
status: done
owner: "-"
workflow: bugfix
created: 2026-09-01
links: ["DOC-29"]
---

## Goal
Corrigir o bug relatado em DOC-29: ao anexar um arquivo no cadastro/edição de um
documento, o anexo não aparecia depois na aba "Visão Geral e Anexo" do
detalhe do documento ("Nenhum arquivo digital anexado a este documento.").

## Context
- Ticket: DOC-29 (Linear), reportado com screenshot mostrando "ANEXO DIGITAL
  VIGENTE: Nenhum arquivo digital anexado a este documento." mesmo após anexar
  um PDF no cadastro.
- Investigação (agente de exploração) identificou a causa raiz com alta
  confiança: `frontend/src/services/api.ts` criava a instância `axios` com um
  header padrão fixo `Content-Type: application/json`. O `transformRequest`
  interno do axios, ao ver esse header já setado como `application/json`,
  serializa qualquer `FormData` via `JSON.stringify(formDataToJSON(data))` em
  vez de enviá-lo como `multipart/form-data` — destruindo o arquivo anexado
  antes mesmo de sair do navegador. No backend, `express.json()` (montado
  antes das rotas) processava esse corpo malformado sem erro, então os campos
  de texto do documento salvavam normalmente, mas `multer`
  (`upload.single('attachment')`) nunca via um corpo `multipart/form-data`
  real, então `req.file` sempre chegava `undefined` e
  `attachmentUrl`/`attachmentFilename`/etc. eram persistidos como `null`.
  `DocumentDetailPage.tsx` só reflete fielmente esse `null` — não é um bug de
  renderização.
- Não foi pego pelos testes existentes porque `backend/tests/document.test.ts`
  e o E2E usam `supertest().attach(...)`, que monta a requisição multipart
  real diretamente na camada HTTP, sem passar pela instância `axios` do
  frontend onde o bug realmente mora.

## Escopo
- `frontend/src/services/api.ts`: removido o header padrão fixo
  `Content-Type: application/json` da instância `axios.create(...)`. O axios
  passa a decidir o `Content-Type` por requisição (JSON para objetos simples,
  `multipart/form-data; boundary=...` automático para `FormData`), que é o
  comportamento correto e documentado da biblioteca.

## Fora de escopo
- Nenhuma mudança no backend (multer, controllers, storageService) — a causa
  raiz era inteiramente do lado do cliente.

## Validação
- Script de reprodução mecânica usando a versão real do `axios` do projeto
  (`node_modules/axios`), simulando a instância antes/depois da correção:
  confirmado que **antes** o `FormData` era convertido em string JSON (bug
  reproduzido em isolamento) e **depois** o `FormData` passa intacto; também
  confirmado que requisições JSON simples (ex. login) continuam funcionando
  normalmente sem o header fixo.
- `npm --prefix frontend run build` e `npm --prefix frontend test` (28/28)
  passam sem alterações de teste necessárias.
- `npm --prefix backend test` (184/185, mesma falha pré-existente e não
  relacionada já documentada em `knowledge.md`) — confirmando nenhuma
  regressão de backend.
- **Teste manual end-to-end via navegador embutido do Orca** (app rodando em
  `http://localhost:3000` via Docker Compose, container `frontend`
  reconstruído com a correção): criado um documento de teste com um PDF real
  anexado — o documento passou a exibir "Anexo: doc29-teste.pdf" na listagem
  e a aba "Visão Geral e Anexo" do detalhe passou a mostrar
  "ANEXO DIGITAL VIGENTE: doc29-teste.pdf • 228 B • application/pdf" com os
  botões "Visualizar"/"Baixar" — reproduzindo e confirmando a correção exata
  do bug relatado. Documento de teste excluído após a verificação.

## Checklist
- [x] Causa raiz identificada com evidência (não suposição)
- [x] Correção aplicada (`frontend/src/services/api.ts`)
- [x] Reprodução mecânica do bug + confirmação da correção via script isolado
- [x] `npm --prefix frontend test` e `npm --prefix backend test` sem regressão
- [x] Teste manual real no navegador confirmando o fluxo completo (criar
      documento com anexo → ver anexo no detalhe)
- [x] Commit único e descritivo

## Log
- 2026-09-01 — Investigado, corrigido e validado (script de reprodução +
  suítes de teste + teste manual em navegador real). Causa raiz: header
  `Content-Type: application/json` fixo na instância `axios` fazia o
  `transformRequest` serializar `FormData` como JSON, destruindo o arquivo
  anexado antes do envio.
