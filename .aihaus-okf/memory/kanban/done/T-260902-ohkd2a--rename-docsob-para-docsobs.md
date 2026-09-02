---
id: T-260902-ohkd2a
title: "Renomear o produto de DocsOb para DocsObs em todo o codebase"
status: done
owner: "-"
workflow: chore
created: 2026-09-02
links: []
---

## Goal
Trocar toda ocorrência do nome do produto "DocsOb" (e variações de caixa)
para "DocsObs" em todo o repositório, a pedido direto do usuário.

## Escopo
Substituição literal, preservando caixa, em 68 arquivos versionados:
`DocsOb`→`DocsObs`, `DOCSOB`→`DOCSOBS`, `docsob`→`docsobs`. Cobre:
- Docs (`README.md`, `docs/PRD.md`, `docs/ARCHITECTURE.md`)
- Memória do projeto "current truth" (`.aihaus-okf/conventions.md`,
  `.aihaus-okf/memory/project/*.md`)
- Frontend: UI (Header, Sidebar, LoginPage x2, NotFoundPage, ProtectedRoute,
  SettingsPage, ToggleStatusConfirmModal, index.html, index.css), serviço de
  API (`api.ts` — chaves de `localStorage` e nome do evento customizado),
  contexto de auth, protótipos HTML estáticos legados
  (`auditoria.html`/`calendario.html`/etc., não usados pelo build do Vite),
  `package.json`/`package-lock.json`
- Backend: `app.ts`, `server.ts`, `notificationService.ts` (templates de
  e-mail), `jwt.ts` (fallback dev do secret), `seed.ts`, `docker-entrypoint.sh`,
  Dockerfile, `package.json`/`package-lock.json`, todos os testes que
  continham o nome em fixtures/asserts
- Infra: `docker-compose.yml` (nome da rede `docsob(s)-network`, defaults de
  `POSTGRES_DB`/`JWT_SECRET`), Dockerfiles, `nginx.conf`, `.env.example`
  (raiz e `backend/`), `scripts/run-e2e.mjs`

## Fora de escopo (deliberado)
- Arquivos de arquivo histórico do kanban (`memory/kanban/done/*.md` de
  tarefas já concluídas e `memory/kanban/fase-*-plan.md`/`*-review.md`) —
  são registros de um ponto no tempo; não fazia sentido reescrever o nome
  usado quando aquele trabalho foi de fato feito.
- `.env` e `backend/.env` (reais, gitignored): contêm `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_DB` e `DATABASE_URL` que já batizam o banco
  Postgres local **atualmente em execução** com dados reais. Renomear esses
  valores sem também migrar o banco (`ALTER DATABASE ... RENAME`) quebraria a
  conexão do backend. Deixado intocado — decisão de infraestrutura separada,
  não uma simples troca de texto. Se o usuário quiser, o próximo passo seria
  `ALTER DATABASE docsob_db RENAME TO docsobs_db;` + atualizar `DATABASE_URL`
  nos dois `.env`, ou simplesmente recriar o volume do Postgres do zero
  (perde os dados de demonstração atuais).
- Não renomeado: o repositório GitHub `anmarfp/ObDocs` e a pasta local
  `C:\Users\Marco\Documents\ObDocs` — isso é uma operação de infraestrutura
  bem mais invasiva (renomear repo, atualizar remotes, mover pasta) e
  distinta de uma troca de texto; não foi pedido explicitamente.

## Validação
- `git grep` case-insensitive por `docsob` confirma zero ocorrências
  remanescentes fora dos arquivos de arquivo histórico e dos `.env` reais.
- Nenhum artefato de duplicação (`DocsObss`/`docsobss`) introduzido.
- Índice de código (`aihaus-okf/tools/index.mjs build`) reconstruído.
- `npm --prefix backend run build` e `npm --prefix backend test` (184/185 —
  única falha pré-existente e já documentada, não relacionada) passam.
- `npm --prefix frontend run build` e `npm --prefix frontend test` (29/29)
  passam.

## Checklist
- [x] Todas as ocorrências (exceto arquivo histórico e `.env` reais) renomeadas
- [x] `package.json` (raiz, backend, frontend) e lockfiles atualizados
- [x] Índice de código reconstruído
- [x] Build e testes de backend e frontend sem regressão
- [x] Commit único e descritivo

## Log
- 2026-09-02 — Renomeação aplicada diretamente pelo orquestrador (troca
  mecânica em escala, sem ambiguidade de julgamento que justificasse
  delegação), validada e documentada.
