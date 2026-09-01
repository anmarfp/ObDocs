---
id: T-260901-n0hk8w
title: DOC-32 — impedir que o deploy padrão crie admin com senha publicada
status: todo
owner: codex-worktree
workflow: bugfix
created: 2026-09-01
links: [DOC-32, DOC-33]
---

## Goal

`docker compose up -d --build` (o comando documentado no README) não pode mais criar
nenhum usuário com senha conhecida. Depois desta tarefa: o seed não roda por padrão, e
quando explicitamente habilitado em produção ele exige senhas definidas em vez de cair
em fallbacks versionados no repositório.

## Context

- Achado **P0-2** da varredura de arquitetura de 01/09/2026 (commit `24274e9`), corroborado
  por duas frentes independentes. Card no Linear: **DOC-32** (urgent).
- A cadeia da falha: `docker-compose.yml:47` (`RUN_SEED` default `true`) →
  `docker-compose.yml:48-50` (senhas passadas como string vazia, que é falsy) →
  `backend/prisma/seed.ts:52,73,128` (`||` cai nos literais `Admin123!@#`,
  `Operacional123!@#`, `Seed123!@#`) → `backend/docker-entrypoint.sh:28-38` (executa o seed).
- A credencial resultante está em `README.md:147` e no botão de preenchimento rápido do
  login (`frontend/src/pages/auth/LoginPage.tsx:60-68,196-212`).
- Agravante: `seed.ts:9-10,126-135` gera 5 usuários demo (um deles ADMIN) a partir de duas
  listas de nomes no próprio código — 80 e-mails enumeráveis, todos com a mesma senha.
- Regra relacionada: RN-009 (gestão restrita a ADMIN) — o vazamento de um ADMIN a
  contorna por completo.
- Relacionado, mas **fora de escopo** desta tarefa: `DOC-33` (fallback do `JWT_SECRET`).

## Checklist

- [ ] `RUN_SEED` com default `false` no `docker-compose.yml`
- [ ] `docker-entrypoint.sh` recusa semear em `NODE_ENV=production` sem senhas explícitas
- [ ] `seed.ts` sem fallbacks literais de senha em produção
- [ ] Usuários e documentos demo criados apenas fora de produção
- [ ] Botão de preenchimento rápido do login some do build de produção
- [ ] Testes backend e frontend verdes (paralelismo limitado)
- [ ] Docker reconstruído e validado ao vivo

## Log

- 2026-09-01 — criado; delegado a uma worktree Orca com agente Codex (gpt-sol, esforço high)
