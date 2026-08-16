---
id: T-260815-e1a086-remover-trilha-de-auditoria-do-dashboard
room: feature
external_id: "DOC-6"
created: 2026-08-15T21:32:09.693Z
---

# Goal

Remover trilha de auditoria do dashboard

## Acceptance

- [x] Seção/tabela da trilha de auditoria removida do painel do dashboard (`wireframes/perspective_dashboard/index.html`).
- [x] Botão/link "Ver Audit Log" ajustado para redirecionar para a página dedicada da sidebar (`auditoria.html`).

## Context

Task DOC-6 do Linear ("remover trilha de auditoria do dashboard"): Remover tabela de trilha de auditoria do dashboard, essa funcionalidade só deve ser acessível pela seção de auditoria da side bar.

## Owned files

- `wireframes/perspective_dashboard/index.html`

## Business-rule gaps

## Log

- Consultado o contexto completo do ticket `DOC-6` via `orca-linear`.
- Removida a seção/tabela `<section class="audit-log-card" id="auditLogSection">` do arquivo `wireframes/perspective_dashboard/index.html`.
- Atualizada a função `openAuditModal(docName)` para redirecionar o usuário para a página dedicada `auditoria.html` acessível pela sidebar.

## Evidence

- [x] Alteração no arquivo [wireframes/perspective_dashboard/index.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/index.html#L534-L537).
- [x] Verificação do `git diff` confirmando a remoção limpa da tabela de auditoria no dashboard.


