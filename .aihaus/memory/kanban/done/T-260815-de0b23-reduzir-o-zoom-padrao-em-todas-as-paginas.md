---
id: T-260815-de0b23-reduzir-o-zoom-padrao-em-todas-as-paginas
room: feature
external_id: "DOC-7"
created: 2026-08-15T21:39:16.941Z
---

# Goal

Reduzir o zoom padrao em todas as paginas

## Acceptance

- [x] Propriedade de zoom/escala ajustada para 90% (`zoom: 90%;`) no `body` das folhas de estilo dos wireframes (`perspective_dashboard`, `perspective_executive`, `perspective_timeline`).
- [x] Visualização panorâmica aprimorada para permitir melhor leitura dos componentes, matrizes de status e tabelas em telas de desktop.

## Context

Task DOC-7 do Linear ("Reduzir o zoom padrão em todas as páginas"): Algumas páginas estão com um zoom padrão muito próximo, dificultando a visualização geral dos componentes e das tabelas. Reduzir o zoom padrão de todas as páginas.

## Owned files

- `wireframes/perspective_dashboard/styles.css`
- `wireframes/perspective_executive/styles.css`
- `wireframes/perspective_timeline/styles.css`

## Business-rule gaps

## Log

- Consultado o contexto do ticket `DOC-7` via `orca-linear`.
- Adicionada a regra `zoom: 90%;` no seletores de `body` em todas as folhas de estilo dos wireframes (`perspective_dashboard/styles.css`, `perspective_executive/styles.css`, `perspective_timeline/styles.css`).
- Verificada a melhoria no enquadramento panorâmico e visualização de tabelas e matrizes.

## Evidence

- [x] Alterações nos arquivos de estilos: [wireframes/perspective_dashboard/styles.css](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_dashboard/styles.css#L65-L68), [wireframes/perspective_executive/styles.css](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_executive/styles.css#L27-L33) e [wireframes/perspective_timeline/styles.css](file:///C:/Users/Marco/Documents/ObDocs/wireframes/perspective_timeline/styles.css#L50).
- [x] Verificação do `git diff` confirmando a aplicação do zoom padrão de 90%.


