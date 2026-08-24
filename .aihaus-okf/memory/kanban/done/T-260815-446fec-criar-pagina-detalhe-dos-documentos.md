---
id: T-260815-446fec-criar-pagina-detalhe-dos-documentos
room: feature
external_id: "DOC-8"
created: 2026-08-15T21:54:12.335Z
---

# Goal

Criar pagina detalhe dos documentos

## Acceptance

- [x] Página de detalhes dos documentos criada (`wireframes/perspective_dashboard/detalhes-documento.html`) exibindo todas as informações completas do documento (título, categoria, emissor, datas, status visual, responsável, anexo e histórico de versões).
- [x] Links das tabelas em `index.html` e `documentos.html` atualizados para abrir a página de detalhes em vez de redirecionar para a auditoria.

## Context

Task DOC-8 do Linear ("Criar página detalhe dos documentos"): Ao clicar em um item da tabela de documentos, abrir uma página com as informações do documento. No modelo atual, essa página não existe, clicar nessa linha leva o usuário à página de auditoria.

## Owned files

- `wireframes/perspective_dashboard/detalhes-documento.html`
- `wireframes/perspective_dashboard/index.html`
- `wireframes/perspective_dashboard/documentos.html`

## Business-rule gaps

## Log

- Consultado o contexto do ticket `DOC-8` via `orca-linear`.
- Criada a página dedicada [`wireframes/perspective_dashboard/detalhes-documento.html`](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/detalhes-documento.html) com suporte a parâmetros de URL dinâmicos (`?doc=...`), exibindo a ficha técnica do documento, anexo, histórico de versões e atalhos do audit log.
- Atualizados os links das tabelas de listagem em `index.html` e `documentos.html` para redirecionar para a nova página de detalhes do documento.

## Evidence

- [x] Criação da nova página [wireframes/perspective_dashboard/detalhes-documento.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/detalhes-documento.html).
- [x] Atualização de links e redirecionamentos em [wireframes/perspective_dashboard/index.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/index.html) e [wireframes/perspective_dashboard/documentos.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/documentos.html#L797-L801).


