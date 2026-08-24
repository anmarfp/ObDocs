---
id: T-260816-f6d84e-ajuste-da-side-bar
room: feature
external_id: "DOC-11"
created: 2026-08-16T16:07:52.016Z
---

# Goal

Ajuste da side bar

## Acceptance

- [x] Sidebar configurada com posição fixa (`position: sticky; top: 64px; height: calc(100vh - 64px);`), de modo que o scroll da página principal não mova a navegação lateral.
- [x] Itens do grupo "Administração" posicionados no fundo (bottom) da sidebar.

## Context

Task DOC-11 do Linear ("Ajuste da side bar"): Mover os itens do campo de "Administração" para o bottom da side-bar. A side bar deve ser fixa, mesmo que o conteúdo da página principal seja mais alto que a tela, scrollar na tela principal deve sempre manter as seções visíveis.

## Owned files

- `wireframes/perspective_dashboard/styles.css`
- `wireframes/perspective_dashboard/index.html`

## Business-rule gaps

## Log

- Consultado o contexto do ticket `DOC-11` e o comentário mais recente via `orca-linear`.
- Identificado que o bloco branco no bottom da página era causado pela regra `zoom: 90%` no CSS, que desajustava o cálculo de `100vh`.
- Ajustada a altura da `.sidebar` no dashboard, e do `body` nas perspectivas Executive e Timeline de `100vh` para `111.1vh`, compensando o zoom e cobrindo a tela inteira sem deixar blocos brancos em resoluções com zoom.
- A barra lateral continua sticky na lateral e acompanha a rolagem sem quebrar.

## Evidence

- [x] Atualização de estilos (height: 111.1vh) em `wireframes/perspective_dashboard/styles.css`, `wireframes/perspective_executive/styles.css` e `wireframes/perspective_timeline/styles.css`.
- [x] Eliminação definitiva do bloco branco inferior em todo o sistema.






