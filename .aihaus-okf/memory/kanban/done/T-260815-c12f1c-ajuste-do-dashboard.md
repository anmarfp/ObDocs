---
id: T-260815-c12f1c-ajuste-do-dashboard
room: feature
external_id: "DOC-5"
created: 2026-08-15T21:25:25.352Z
---

# Goal

Ajuste do dashboard

## Acceptance

- [x] Tabela de documentos do `perspective_dashboard/index.html` atualizada para a estrutura do modelo `perspective_executive` (colunas: Status, Título do Documento, Categoria, Vencimento, Responsável, Ações).
- [x] Estilos e classes visuais ajustados mantendo perfeita harmonia com a UI do `perspective_dashboard`.
- [x] Compatibilidade mantida com as funções JavaScript de filtragem, edição, visualização, arquivamento e exclusão de documentos.

## Context

Task DOC-5 do Linear ("Ajuste do dashboard"): Trocar a tabela de listagem dos documentos da perspective dashboard pela tabela do modelo perspective executive, mas alterar o estilo da tabela para permanecer em harmonia com o UI do perspective dashboard.

## Owned files

- `wireframes/perspective_dashboard/index.html`
- `wireframes/perspective_dashboard/styles.css`

## Business-rule gaps

## Log

- Consultado o contexto completo do ticket `DOC-5` diretamente no Linear via `orca-linear`.
- Atualizada a estrutura da tabela em `wireframes/perspective_dashboard/index.html` para adotar as 6 colunas do modelo `perspective_executive` (Status, Título do Documento, Categoria, Vencimento, Responsável, Ações).
- Mantido o estilo responsivo e elegante da UI do `perspective_dashboard`.
- Ajustado o script `updateStatusToRenovacao(btn)` para referenciar o índice correto da coluna de status (`tr.children[0]`).

## Evidence

- [x] Verificação do arquivo [wireframes/perspective_dashboard/index.html](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/index.html#L188-L380).
- [x] Execução limpa do `git diff` demonstrando o ajuste correto das colunas e eventos.


