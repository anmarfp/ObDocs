---
id: T-260816-ca0261-remover-o-componente-do-google-agenda-do-header
room: feature
external_id: "DOC-10"
created: 2026-08-16T16:12:34.275Z
---

# Goal

Remover o componente do google agenda do header

## Acceptance

- [x] Componente da sincronização com Google Agenda (`.google-sync-card`) removido do topo (header) em todas as páginas do sistema.

## Context

Task DOC-10 do Linear ("Remover o componente do google agenda do header"): Remover o componente do google agenda do header.

## Owned files

- `wireframes/perspective_dashboard/index.html`
- `wireframes/perspective_dashboard/documentos.html`
- `wireframes/perspective_dashboard/calendario.html`
- `wireframes/perspective_dashboard/auditoria.html`
- `wireframes/perspective_dashboard/configuracoes.html`
- `wireframes/perspective_dashboard/detalhes-documento.html`
- `wireframes/perspective_dashboard/usuarios.html`

## Business-rule gaps

## Log

- Consultado o contexto do ticket `DOC-10` via `orca-linear`.
- Removido o bloco `<div class="google-sync-card">...</div>` do cabeçalho superior (`top-header`) em todas as páginas do protótipo (`index.html`, `documentos.html`, `calendario.html`, `auditoria.html`, `configuracoes.html`, `detalhes-documento.html` e `usuarios.html`).

## Evidence

- [x] Remoção do componente de sincronização nos cabeçalhos dos arquivos HTML em [wireframes/perspective_dashboard/index.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/index.html#L23-L27).
- [x] Verificação do `git diff` confirmando a limpeza do componente no header.


