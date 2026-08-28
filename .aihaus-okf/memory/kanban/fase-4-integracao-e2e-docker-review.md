# Parecer adversarial — Fase 4: Integração, E2E e Docker

**Data:** 2026-08-27  
**Reviewer:** Codex (`review-careful`)  
**Veredito:** `ship-with-changes`

O plano não é executável com segurança como está. A direção geral é válida, mas uma máquina limpa não será provisionada: não há migrations versionadas para `prisma migrate deploy`, o seed pode falhar silenciosamente e a suíte descrita como full-stack importa o Express em memória, sem atravessar Docker, Nginx ou a rede. O prompt canônico ao final substitui essas partes por um fluxo reproduzível.

## Evidência auditada

- Plano: `.aihaus-okf/memory/kanban/fase-4-integracao-e2e-docker-plan.md`.
- Configuração real: `backend/package.json`, `backend/tsconfig.json`, `backend/src/{server,app}.ts`, `backend/prisma/{schema,seed}.ts`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `docker-compose.yml`, `package.json`, `.env.example` e `README.md`.
- Testes existentes: seis arquivos backend e dois frontend.
- O índice do codebase estava `STALE`; os resultados do índice não foram usados como verdade.
- Worktree preservado: os planos/prompts/pareceres não rastreados preexistentes não foram alterados.

## Achados confirmados

| Severidade | Achado | Evidência e reprodução | Correção obrigatória |
|---|---|---|---|
| Bloqueante | Banco limpo não pode ser criado por `migrate deploy` | `git ls-files backend/prisma` contém apenas `schema.prisma` e `seed.ts`; não existe `backend/prisma/migrations/`. `migrate deploy` só aplica migrations existentes. O volume novo não recebe tabelas e o seed falha. | Criar e versionar uma migration inicial PostgreSQL antes do Docker; validar com volume vazio e `prisma migrate deploy`. Não substituir por `db push` em produção. |
| Bloqueante | “E2E full-stack” não atravessa o stack | O helper proposto usa `supertest(app)` (`fase-4...plan.md:582`), portanto executa Express no processo do Vitest. Não testa imagem backend, entrypoint, Nginx, proxy, portas, healthchecks ou volumes. | Testar uma `E2E_BASE_URL` HTTP real, preferencialmente `http://localhost:<frontend-port>/api/v1` através do Nginx; não importar `app`. Chamar a suíte de HTTP integration/smoke, não browser E2E. |
| Bloqueante | Seed falha silenciosamente | O entrypoint proposto usa `npx tsx prisma/seed.ts || echo ...` (`plan:107`). Qualquer erro de conexão, schema ou código é convertido em sucesso e o container sobe sem credenciais. | Seed idempotente deve falhar o startup quando habilitado; remover `|| echo`. Executar somente com `RUN_SEED=true` e usar o JS compilado. |
| Alta | O start real do backend aponta para arquivo errado | `rootDir: "."` + `include: src/**/*, prisma/**/*` (`backend/tsconfig.json:8,15`) gera `dist/src/server.js`. `backend/package.json:5,9` usa `dist/server.js`; o CMD do plano, `dist/src/server.js`, está correto. | Corrigir `main` e `start` para `dist/src/server.js`; manter o mesmo caminho no Docker CMD. |
| Alta | Retry prometido não foi implementado | A matriz de risco exige até cinco tentativas (`plan:694`), mas o script em `plan:100-110` executa `migrate deploy` uma única vez. | Implementar loop limitado, logar tentativa, dormir entre tentativas e sair !=0 após o limite. O healthcheck do PostgreSQL continua obrigatório. |
| Alta | CRLF pode quebrar o entrypoint | `git config core.autocrlf` é `true` e não existe `.gitattributes`. `chmod +x` não remove `\r` do shebang. | Versionar `.gitattributes` com `*.sh text eol=lf`; como defesa adicional, normalizar CRLF no Dockerfile antes de `chmod`. |
| Alta | Estratégia E2E usa banco de desenvolvimento e é não determinística | O plano manda migrar/semear `DATABASE_URL` corrente (`plan:495-510`) e diz “mesmo banco de testes ou banco ephemeral”. O seed só cria usuários quando ausentes (`seed.ts:21-58`), logo senhas/roles modificadas não são restauradas. | Tornar `E2E_DATABASE_URL`/stack isolado obrigatório, com projeto Compose e volumes próprios descartados em `finally`. Nunca aceitar URL de produção/desenvolvimento por padrão. |
| Alta | Testes E2E vazam para a suíte unitária | `backend/vitest.config.ts:7` inclui `tests/**/*.test.ts`; futuros `tests/e2e/**/*.test.ts` também rodariam em `npm test`. | Excluir `tests/e2e/**` da config unitária e usar config E2E dedicada. Definir claramente `test:unit`, `test:e2e` e `test:all`. |
| Alta | Casos numerados dependem implicitamente de ordem/estado | TC-04/06 dependem do documento criado em TC-03. Prefixos `01-...` e `singleFork` não são um contrato suficiente de isolamento. | Cada teste cria seus pré-requisitos com identificadores únicos, ou uma única jornada serial assume explicitamente a sequência. Preferir fixtures/helpers e stack descartável por execução. |
| Alta | A execução “dentro do Docker” não existe | O `.dockerignore` proposto exclui `tests` e `vitest`, e a imagem de produção não expõe runner. O Compose possui só postgres/backend/frontend. | Documentar runner local/CI contra o stack Docker ou adicionar serviço/profile E2E dedicado. Não alegar execução dentro do container de produção. |
| Alta | Fase 3 não está presente no estado auditado | `frontend/package.json` não contém Recharts; existem 10 ocorrências de `it(...)` no frontend, não 28; páginas da Fase 3 ainda são placeholders/mocks. | Gate 0: iniciar Fase 4 apenas sobre commit que contenha Fase 3 aprovada. Não absorver implementação funcional da Fase 3 neste escopo de infraestrutura. |
| Média | Contagens de testes declaradas são falsas/não comprovadas | O plano afirma 140 backend e 28 frontend (`plan:7-8,439,679,719`). O código contém 138 casos `it(...)` backend e 10 frontend; não foi possível executá-los sem `node_modules`. | Não hardcodar contagens no README/DoD. Reportar a saída real do Vitest em cada execução. |
| Média | Imagem “enxuta” copia todas as devDependencies | O plano copia `builder/node_modules`, incluindo TypeScript, Vitest, Supertest e TSX. O entrypoint depende de `tsx` porque executa seed TS. | Compilar seed para `dist/prisma/seed.js`; colocar Prisma CLI disponível em runtime de forma explícita e instalar somente runtime deps no estágio final, ou admitir/documentar imagem não enxuta. Nunca permitir download implícito pelo `npx`. |
| Média | Prisma Alpine precisa de estratégia explícita de engine | O schema não declara `binaryTargets` (`schema.prisma:1-3`). Gerar no builder Alpine e executar na mesma família normalmente resolve `native`, mas o requisito musl/OpenSSL 3 não está comprovado. | Gerar o Client dentro de Alpine com OpenSSL 3 e declarar/validar `linux-musl-openssl-3.0.x` (mais `native` se necessário); executar uma query real no container. |
| Média | Variáveis de storage do Compose são ignoradas | `storageService.ts:6-7` usa `process.cwd()/uploads` e limite fixo; `UPLOAD_DIR` e `MAX_FILE_SIZE_BYTES` do Compose não têm efeito. | Consumir/validar essas variáveis no service ou removê-las do Compose/README. O mount `/app/uploads` funciona hoje apenas porque `WORKDIR=/app`. |
| Média | Seed ocorre em todo restart e imprime senha | O entrypoint sempre semeia; `seed.ts:37,57` registra credenciais em texto claro na primeira criação. | Gate `RUN_SEED`, habilitado apenas no Compose local/E2E; nunca logar senhas. Em produção, seed deve ser operação explícita. |
| Média | `db:reset` raiz aponta para script inexistente | O plano define `npm --prefix backend run db:reset` (`plan:411`), mas `backend/package.json` não possui esse script. | Adicionar script backend explícito e documentar que é destrutivo, ou remover o atalho. |
| Média | `postinstall` não é reprodutível | O plano usa `npm --prefix ... install` (`plan:421`), que pode atualizar lockfiles e resolve versões novamente. | Usar `npm ci` nos três níveis quando lockfiles estiverem versionados; atualizar o lock raiz junto do package. |
| Média | `npm test` não valida a cadeia completa | O prompt exige uma suíte completa via `npm test`; o plano mantém `test` apenas backend e `test:all` sem E2E (`plan:401-404`). | Definir `test:unit`, `test:e2e`, `test:all`; se o requisito for literal, `npm test` chama `test:all`. Documentar a necessidade do Docker para E2E. |
| Média | README local usa comando não universal | O exemplo `cp .env.example backend/.env` (`plan:658`) não funciona em `cmd.exe`. | Fornecer variantes PowerShell, CMD e Bash, ou uma rotina Node cross-platform. |
| Média | Proxy `/uploads/` separado seria incorreto | A API real serve anexos protegidos em `/api/v1/uploads` (`backend/src/app.ts:34`). O `location /api/v1/` proposto já cobre uploads e preserva Authorization. | Não criar alias `/uploads/` sem alterar backend. Manter um único proxy `/api/v1/`; testar upload e download autenticado por ele. |
| Média | Segredos são hardcoded em Compose “de produção” | O plano fixa senha PostgreSQL e JWT no YAML (`plan:273-275,303-305`). | Classificar Compose como ambiente local; usar interpolação `${VAR:-default-local}` e exigir segredo sem default em deploy real. O README deve advertir que os defaults não são produção. |
| Média | `container_name` dificulta CI paralelo | Nomes globais fixos colidem entre worktrees/projetos Compose. | Omitir `container_name` e deixar o Compose isolar nomes por project name. |
| Média | Não há teste de SPA/browser | Supertest/fetch da API não prova “login funcional” no React nem fallback de deep link. | Adicionar smoke HTTP para `/`, `/login`, rota profunda e `/api/v1/health`; tratar UI/browser E2E como escopo Playwright separado se necessário. |

## Pontos corretos do plano

- O entrypoint do servidor compilado deve ser `dist/src/server.js`.
- `VITE_API_URL=/api/v1` combina com o `baseURL` atual (`frontend/src/services/api.ts:7-10`).
- `location /api/v1/` com `proxy_pass http://backend:3001/api/v1/` preserva o prefixo sem duplicação para requests normais.
- `try_files $uri $uri/ /index.html` é o fallback correto da SPA.
- O volume `/app/uploads` corresponde ao caminho efetivo atual por causa de `WORKDIR /app`.
- PostgreSQL 16 Alpine, healthchecks, `depends_on: condition: service_healthy` e volumes nomeados são escolhas coerentes para o ambiente local.
- `bcryptjs` é JavaScript puro; não exige toolchain nativa.
- `rimraf` e `concurrently` são adequados para scripts Windows/Linux/macOS.

## Julgamento por critério

- Docker backend em máquina limpa: `not_satisfied` — migration ausente e seed mascarado.
- Prisma Alpine: `partial` — desenho provável, engine não validada em container.
- Docker frontend/Nginx: `satisfied` no desenho, ainda não executado.
- Persistência PostgreSQL/uploads: `partial` — volumes corretos, sem prova executada.
- Scripts cross-platform: `partial` — ferramentas adequadas; `db:reset`, `postinstall`, README e semântica de testes precisam correção.
- E2E da cadeia completa: `not_satisfied` — proposta é in-process e usa banco potencialmente compartilhado.
- README operacional: `not_satisfied` — arquivo atual possui apenas duas linhas e o template contém alegações não comprovadas.
- Pré-requisito Fase 3: `not_satisfied` no commit auditado.

## Verificação realizada

- `node .aihaus-okf/tools/index.mjs status`: `STALE`; índice descartado.
- `git ls-files backend/prisma`: somente schema e seed, zero migrations.
- `docker --version`: 29.7.2; `docker compose version`: v5.3.1. O acesso ao config do usuário Docker gerou aviso de permissão, e nenhuma stack foi iniciada nesta revisão.
- Contagem estática: 138 casos `it(...)` backend e 10 frontend; não equivale a execução verde.
- `node_modules` não está instalado; build/test não foram executados. Nenhum Dockerfile do plano existe ainda para construir.
- Nenhum arquivo de produção foi alterado.

## Prompt canônico para o Implementer (Antigravity)

```text
Você é o IMPLEMENTER da Fase 4 do DocsOb. Entregue integração reproduzível, Docker Compose full-stack, scripts cross-platform, smoke HTTP contra o stack real e README operacional. Use o código atual como verdade e aplique as correções deste prompt; não copie literalmente o plano original.

GATE 0 — PRÉ-REQUISITO E ESCOPO
1. Atualize a branch e confirme que a Fase 3 aprovada está presente: Recharts/dependência escolhida, páginas sem mocks/placeholders, serviços da Fase 3 e testes correspondentes. Se não estiver, registre bloqueio e coordene o merge; não implemente a Fase 3 dentro desta tarefa.
2. Preserve alterações não relacionadas do worktree. Arquivos principais permitidos: docker-compose.yml, package.json/package-lock.json, README.md, .env.example, .gitattributes, scripts/ de orquestração; backend/{Dockerfile,.dockerignore,docker-entrypoint.sh,package*.json,tsconfig.json,vitest*.ts,tests/e2e/**,prisma/**,src/services/storageService.ts}; frontend/{Dockerfile,.dockerignore,nginx.conf,package*.json}. Não refatore regras de negócio.
3. Faça inventário das versões e execute os testes existentes antes de alterar quando as dependências estiverem disponíveis. Não use contagens hardcoded como prova.

MIGRATIONS E PRISMA — BLOQUEANTE
1. Crie e versione uma migration inicial PostgreSQL em backend/prisma/migrations/ a partir do schema atual, usando banco descartável. Inclua migration_lock.toml. Não use prisma db push para o fluxo de produção.
2. Prove em banco/volume vazio: prisma migrate deploy cria todas as tabelas; depois o seed conclui; uma segunda execução de migrate+seed também conclui sem duplicar dados.
3. O Prisma Client deve ser gerado dentro de Alpine com OpenSSL 3. Declare/valide binaryTargets incluindo native e linux-musl-openssl-3.0.x conforme Prisma 6.4. Execute uma query real no container; a simples conclusão de prisma generate não basta.

BACKEND DOCKER
1. O TypeScript usa rootDir='.' e emite src/server.ts como dist/src/server.js e prisma/seed.ts como dist/prisma/seed.js. Corrija backend/package.json main/start e use CMD ['node','dist/src/server.js'].
2. Crie Dockerfile multi-stage Node 20 Alpine. Use npm ci com lockfile, OpenSSL 3, prisma generate e npm run build. No estágio final, não dependa de downloads npx. Disponibilize explicitamente o Prisma CLI necessário ao migrate deploy e instale apenas dependências runtime; execute o seed compilado com node dist/prisma/seed.js, sem tsx em runtime.
3. Rode como usuário node. Garanta leitura dos artefatos/Prisma e escrita apenas em /app/uploads. Crie/chown o diretório antes de USER.
4. docker-entrypoint.sh deve usar #!/bin/sh, set -eu, LF e permissão executável. Implemente retry limitado de migrate deploy (por exemplo 10 tentativas com 2s); após o limite, exit !=0. Não masque falhas.
5. Execute seed apenas se RUN_SEED=true. Se habilitado e falhar, aborte. Remova logs de senha do seed. O seed deve continuar idempotente.
6. Adicione .gitattributes com '*.sh text eol=lf'. Como defesa para clones Windows, remova CR no Dockerfile antes do chmod.
7. storageService deve respeitar UPLOAD_DIR e MAX_FILE_SIZE_BYTES com parsing/validação e fallbacks seguros, ou essas variáveis devem ser removidas. Mantenha proteção contra traversal.

FRONTEND DOCKER E NGINX
1. Dockerfile multi-stage: Node 20 Alpine + npm ci + build Vite; Nginx Alpine final somente com dist e nginx.conf.
2. Build arg VITE_API_URL default '/api/v1'. O cliente já usa esse valor como baseURL; todos os services usam paths relativos.
3. nginx.conf: health `/health`; `location /api/v1/` -> `proxy_pass http://backend:3001/api/v1/`; preserve Host/X-Forwarded-* e Authorization padrão; client_max_body_size >=12M; timeouts de upload; assets cacheados; SPA `try_files $uri $uri/ /index.html`.
4. Não crie proxy `/uploads/`: os anexos reais estão em `/api/v1/uploads/*` e já passam pelo proxy API autenticado.
5. Teste `/`, `/login`, uma rota profunda com refresh, `/api/v1/health`, login, upload e download autenticado pelo endereço do frontend Nginx.

DOCKER COMPOSE
1. Serviços: postgres:16-alpine, backend e frontend; rede e volumes nomeados para PG/uploads. Omitir container_name para permitir projetos paralelos.
2. Healthchecks reais nos três serviços. Backend depende de PostgreSQL healthy; frontend depende de backend healthy. Use `docker compose up -d --build --wait` na verificação.
3. Use interpolação de ambiente para portas, usuário/senha DB e JWT. Defaults fracos só podem existir como defaults locais claramente documentados; deploy real deve exigir segredos.
4. Defina RUN_SEED=true apenas no Compose local/E2E de primeiro provisionamento. Reinício deve ser idempotente.
5. Permita portas parametrizadas (POSTGRES_PORT, BACKEND_PORT, FRONTEND_PORT) para CI/worktrees. Preserve dados no down comum; down -v deve ser marcado como destrutivo.
6. Valide: fresh up; todos healthy em <=90s após imagens prontas; restart; down/up preserva DB/upload; projeto E2E isolado; reset -v recria e semeia.

SCRIPTS RAIZ CROSS-PLATFORM
1. Atualize package.json e package-lock.json raiz. Use concurrently e rimraf locais; nenhum pacote global.
2. Use npm --prefix nos módulos. postinstall deve usar npm ci nos subprojetos com lockfiles, não npm install.
3. Defina scripts claros: dev:all, build:all, test:unit, test:e2e, test:all, test, db:generate, db:migrate, db:seed, db:reset, docker:up/down/reset/logs e clean.
4. Adicione backend db:reset se mantiver o alias; destaque que ele e docker:reset destroem dados. Não execute reset automaticamente.
5. Para cumprir o requisito da cadeia completa, `npm test` deve chamar `test:all`; `test:all` roda unitários backend, unitários frontend e E2E. Documente que E2E requer Docker. Se o custo for inadequado para desenvolvimento, mantenha `test:unit` como atalho rápido.

E2E/SMOKE REAL E ISOLADO
1. Não importe backend/src/app. Use Supertest contra URL (`supertest(E2E_BASE_URL)`) ou fetch. E2E_BASE_URL deve apontar ao proxy Nginx, por exemplo http://127.0.0.1:33000/api/v1.
2. Crie um orquestrador Node cross-platform em scripts/run-e2e.mjs. Ele sobe Compose com project name exclusivo (docsob-e2e), portas alternativas e volumes próprios, espera health via `docker compose ... up --wait`, executa o runner Vitest e, em finally, roda `docker compose ... down -v --remove-orphans`. Nunca derrube o projeto de desenvolvimento.
3. Faça o runner recusar URL ausente ou não reconhecida; nunca use DATABASE_URL de desenvolvimento/produção por fallback. A stack E2E nasce vazia a cada execução e é destruída ao final.
4. backend/vitest.config.ts deve excluir tests/e2e/**. vitest.e2e.config.ts inclui somente E2E, singleFork e timeouts adequados. Não execute migrate/seed por globalSetup contra URL arbitrária; o entrypoint da stack isolada faz isso.
5. Testes não devem depender da ordem de arquivos. Cada caso cria pré-requisitos próprios com UUID/sufixo único. Use datas relativas determinísticas e um PDF fixture mínimo versionado. Limpe arquivos via API quando possível; o volume E2E descartável é a garantia final.
6. Cubra pelo proxy real: health; login admin/op + /me; RBAC; dashboard; categoria/config necessária; criação multipart com attachment; listagem; status; renovação e versão; calendário mês+ano; audit CREATE/RENEW pelo ID criado e 403 operacional; CSV headers/BOM/Content-Disposition; usuário único, reset, novo login, inativação e 403 operacional.
7. Para audit, não aceite apenas logs não vazios: encontre ações/documentId produzidos pelo próprio teste. Para calendário, crie documento no mês consultado. Para CSV, valide Content-Type, filename, BOM e conteúdo do documento criado.
8. Adicione smokes de infraestrutura: frontend `/`, `/login` e deep link retornam HTML da SPA; API via Nginx funciona; upload permanece baixável após restart do backend; dados permanecem após down/up sem -v.
9. Nomeie a suíte “HTTP integration/smoke”. Ela não valida interação do navegador React. Se o DoD exigir login funcional na UI, crie tarefa Playwright separada ou inclua Playwright explicitamente; não alegue cobertura browser com Supertest.

README E AMBIENTES
1. Reescreva README com arquitetura, pré-requisitos e comandos reais. Separe claramente: Docker local, desenvolvimento local, HTTP E2E isolado e deploy (não coberto pelo Compose local).
2. Documente Bash, PowerShell e CMD para copiar env; não use apenas `cp`. Liste URLs/portas parametrizáveis e troubleshooting de portas/Docker/CRLF.
3. Credenciais seed são somente locais. Mostre-as sem afirmar segurança de produção. Não imprima senhas nos logs do seed.
4. Não fixe contagens “140/28”; use “consulte a saída do Vitest”. Não afirme Google Agenda real: o backend atual usa simulação estruturada.
5. Documente que docker:reset e db:reset são destrutivos e que uploads/DB só persistem sem -v.

VERIFICAÇÃO OBRIGATÓRIA E EVIDÊNCIA
1. npm ci na raiz (instala subprojetos de forma reprodutível).
2. npm run build:all.
3. npm run test:unit.
4. docker compose config --quiet.
5. docker compose build --no-cache backend frontend ao menos uma vez.
6. docker compose up -d --build --wait e docker compose ps.
7. Smoke de health/frontend/proxy/login/upload/download.
8. npm run test:e2e em projeto isolado.
9. Prova de persistência após restart e down/up; depois reset do projeto de teste apenas.
10. npm test para a cadeia completa.
11. Registre comandos, exit codes, serviços healthy, testes passados e limitações. Não marque PASS se qualquer prova foi apenas escrita e não executada.

ENTREGA
- Liste arquivos alterados e decisões.
- Entregue resultados literais das verificações.
- Destaque gaps fora da Fase 4: Fase 3 ausente se ainda não mergeada, Google Calendar/e-mail simulados e browser E2E não coberto sem Playwright.
```

## Handoff

O Implementer pode prosseguir apenas com o prompt canônico e após o Gate 0. Os três bloqueios que precisam ser eliminados antes de qualquer claim de “um comando em máquina limpa” são: migration inicial versionada, entrypoint que falha corretamente e E2E contra o endpoint real do stack.
