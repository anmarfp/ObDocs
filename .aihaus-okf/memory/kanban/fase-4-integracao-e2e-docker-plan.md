# 📋 Plano Arquitetural da Fase 4: Integração Full-Stack, Docker Compose, Scripts Unificados e Validação E2E

**Projeto:** DocsOb — Gestão de Vencimento de Documentos  
**Agente Responsável:** Planner (`plan-orchestrator`)  
**Status:** Pronto para Execução / Aprovado para Implementação  
**Data:** 27/08/2026  
**Backend:** Node.js 20, Express 4, TypeScript 5, Prisma 6, PostgreSQL 16 — 140 testes verdes  
**Frontend:** React 18, Vite, TypeScript, Tailwind CSS (Midnight Navy), Recharts, Lucide — 28 testes verdes  
**Repositório:** Monorepo simples (`backend/`, `frontend/`, `docs/`, `.aihaus-okf/`)  

---

## 📑 1. Resumo Executivo e Objetivos

A **Fase 4** fecha o ciclo de engenharia do DocsOb, transformando o monorepo de desenvolvimento em uma **plataforma containerizada, auto-provisionante e validada de ponta a ponta**. Os quatro pilares desta fase:

1. **Dockerização Completa (Local-First — 1 Comando):** Dockerfiles de produção para backend (Node Alpine + Prisma) e frontend (multi-stage Vite → Nginx Alpine com proxy reverso e SPA fallback), orquestrados por um `docker-compose.yml` unificado com PostgreSQL 16, healthchecks, volumes persistentes e rede isolada. O comando `docker compose up -d` provisiona banco, migra schema, semeia dados iniciais e sobe a aplicação completa em <90 segundos.

2. **Scripts Unificados no `package.json` Raiz:** Ponto de entrada único para desenvolvedores — `npm run dev:all` (backend + frontend concorrentes), `npm run build:all`, `npm run test:all`, `npm run docker:up`, `npm run docker:down`, seeds e migrações — eliminando a necessidade de navegar entre subpastas.

3. **Suíte de Testes E2E / Smoke de Integração Full-Stack:** Bateria automatizada que valida as 8 jornadas críticas do usuário contra a API real (login → dashboard → CRUD documento → renovação → calendário → auditoria → exportação CSV → gestão de usuários), executável tanto localmente quanto dentro do Docker.

4. **README.md de Operação Completo:** Documentação executiva com arquitetura do sistema, guia de início rápido (Docker e local), tabela de credenciais do seed, lista de comandos úteis e referências à documentação técnica.

---

## 🐳 2. Especificação Técnica dos Dockerfiles e Docker Compose

### 2.1 `backend/Dockerfile`

```dockerfile
# ==============================================================================
# DOCSOB BACKEND — Dockerfile de Produção
# ==============================================================================
# Imagem base: Node.js 20 Alpine (tamanho mínimo, segurança maximizada)
# Saída: Servidor Express compilado em /app/dist, Prisma Client gerado,
#        migrações aplicadas via entrypoint e uploads persistidos em /app/uploads

# ---- Stage 1: Instalação de Dependências e Build ----
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências de build necessárias para bcrypt/prisma (compilação nativa)
RUN apk add --no-cache openssl

# Copia lockfiles primeiro para cache eficiente de camadas Docker
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDependencies para compilação)
RUN npm ci

# Gera o Prisma Client otimizado para o target linux-musl (Alpine)
RUN npx prisma generate

# Copia código-fonte e compila TypeScript
COPY . .
RUN npm run build

# ---- Stage 2: Imagem de Produção Enxuta ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

# Copia apenas os artefatos necessários do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Cria diretório de uploads com permissões adequadas
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Copia script de entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Variáveis de ambiente com valores padrão sensíveis
ENV NODE_ENV=production
ENV PORT=3001
ENV UPLOAD_DIR=/app/uploads

# Porta exposta pela aplicação
EXPOSE 3001

# Executa com usuário não-root por segurança
USER node

# Entrypoint: migra banco, semeia se necessário, inicia servidor
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/src/server.js"]
```

### 2.2 `backend/docker-entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "🔧 [Entrypoint] Executando migrações Prisma..."
npx prisma migrate deploy

echo "🌱 [Entrypoint] Executando seed (idempotente)..."
npx tsx prisma/seed.ts || echo "⚠️ Seed já executado ou ignorado."

echo "🚀 [Entrypoint] Iniciando servidor DocsOb na porta ${PORT:-3001}..."
exec "$@"
```

### 2.3 `backend/.dockerignore`

```
node_modules
dist
coverage
.env
.env.local
.env.*.local
*.log
uploads/*
!uploads/.gitkeep
.git
.gitignore
tests
**/*.test.ts
**/*.spec.ts
vitest.config.*
README.md
```

### 2.4 `frontend/Dockerfile`

```dockerfile
# ==============================================================================
# DOCSOB FRONTEND — Dockerfile Multi-Stage (Vite Build → Nginx Alpine)
# ==============================================================================
# Stage 1: Compilação estática com Vite
# Stage 2: Serve com Nginx Alpine + SPA fallback + Proxy Reverso /api/v1

# ---- Stage 1: Build de Produção com Vite ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copia lockfiles para cache eficiente
COPY package.json package-lock.json* ./

# Instala dependências
RUN npm ci

# Copia código-fonte e compila
COPY . .

# Variável de ambiente da API para build-time (substituída em runtime pelo Nginx proxy)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Stage 2: Nginx Alpine para Servir Estáticos ----
FROM nginx:1.27-alpine AS production

# Remove configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia artefatos do build Vite para o diretório de servimento do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Porta exposta
EXPOSE 80

# Healthcheck do Nginx
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### 2.5 `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Compressão Gzip para assets estáticos
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1024;
    gzip_vary on;

    # Health check endpoint para Docker
    location /health {
        access_log off;
        return 200 '{"status":"ok","service":"docsob-frontend"}';
        add_header Content-Type application/json;
    }

    # Proxy reverso para a API backend (/api/v1/*)
    location /api/v1/ {
        proxy_pass http://backend:3001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Suporte para uploads grandes (10 MB máximo)
        client_max_body_size 12M;

        # Timeouts generosos para uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout    120s;
        proxy_read_timeout    120s;
    }

    # Cache de longa duração para assets versionados pelo Vite (hash no nome)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA Fallback — todas as rotas não-arquivo redirecionam para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2.6 `frontend/.dockerignore`

```
node_modules
dist
coverage
.env
.env.local
.env.*.local
*.log
.git
.gitignore
README.md
```

### 2.7 `docker-compose.yml` (Raiz do Projeto — Substituição Completa)

```yaml
# ==============================================================================
# DocsOb — Docker Compose (Full-Stack: PostgreSQL + Backend + Frontend)
# ==============================================================================
# Início rápido: docker compose up -d
# Parada: docker compose down
# Reset completo: docker compose down -v && docker compose up -d --build

version: "3.9"

services:
  # ---------- Banco de Dados PostgreSQL 16 ----------
  postgres:
    image: postgres:16-alpine
    container_name: docsob_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: docsob_user
      POSTGRES_PASSWORD: docsob_password
      POSTGRES_DB: docsob_db
    ports:
      - "5432:5432"
    volumes:
      - docsob_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U docsob_user -d docsob_db"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    networks:
      - docsob_net

  # ---------- Backend API (Express + Prisma) ----------
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: docsob_backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3001
      DATABASE_URL: "postgresql://docsob_user:docsob_password@postgres:5432/docsob_db?schema=public"
      JWT_SECRET: "docsob-docker-jwt-secret-change-in-production"
      JWT_EXPIRES_IN: "7d"
      UPLOAD_DIR: /app/uploads
      MAX_FILE_SIZE_BYTES: "10485760"
    ports:
      - "3001:3001"
    volumes:
      - docsob_uploads:/app/uploads
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/api/v1/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - docsob_net

  # ---------- Frontend SPA (Nginx + Vite Build) ----------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: /api/v1
    container_name: docsob_frontend
    restart: unless-stopped
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "3000:80"
    networks:
      - docsob_net

# ---------- Volumes Nomeados Persistentes ----------
volumes:
  docsob_pgdata:
    driver: local
  docsob_uploads:
    driver: local

# ---------- Rede Isolada ----------
networks:
  docsob_net:
    driver: bridge
```

### 2.8 Diagrama de Arquitetura Docker

```
                ┌──────────────────────────────────────────────────┐
                │            Host Developer Machine                │
                │                                                  │
                │  ┌────────────────────────────────────────────┐  │
                │  │         docker-compose.yml                 │  │
                │  │                                            │  │
                │  │  ┌─────────────┐    ┌──────────────────┐  │  │
   :3000 ◄──────┼──┼──│  frontend   │    │    postgres       │──┼──┼──► :5432
   (Browser)    │  │  │ Nginx:80    │    │  PostgreSQL 16   │  │  │
                │  │  │ SPA + Proxy │    │  Vol: pgdata     │  │  │
                │  │  └──────┬──────┘    └────────▲─────────┘  │  │
                │  │         │  /api/v1/*         │             │  │
                │  │         ▼  proxy_pass        │ DATABASE_URL│  │
                │  │  ┌──────────────┐            │             │  │
   :3001 ◄──────┼──┼──│  backend     │────────────┘             │  │
   (API Direct) │  │  │ Express:3001 │                          │  │
                │  │  │ Vol: uploads │                          │  │
                │  │  └──────────────┘                          │  │
                │  │                                            │  │
                │  │  Network: docsob_net (bridge)              │  │
                │  └────────────────────────────────────────────┘  │
                └──────────────────────────────────────────────────┘
```

---

## 📦 3. Mapeamento dos Scripts do `package.json` Raiz

### 3.1 Novo `package.json` da Raiz (Atualizado)

```json
{
  "name": "docsob",
  "version": "1.0.0",
  "private": true,
  "description": "DocsOb - Sistema de Gestão de Vencimento de Documentos",
  "scripts": {
    "dev": "npm --prefix backend run dev",
    "dev:frontend": "npm --prefix frontend run dev",
    "dev:all": "concurrently -n BE,FE -c blue,green \"npm --prefix backend run dev\" \"npm --prefix frontend run dev\"",

    "build": "npm --prefix backend run build",
    "build:frontend": "npm --prefix frontend run build",
    "build:all": "npm --prefix backend run build && npm --prefix frontend run build",

    "start": "npm --prefix backend start",

    "test": "npm --prefix backend test",
    "test:frontend": "npm --prefix frontend run test",
    "test:all": "npm --prefix backend test && npm --prefix frontend run test",
    "test:e2e": "npm --prefix backend run test:e2e",
    "test:watch": "npm --prefix backend run test:watch",

    "db:generate": "npm --prefix backend run db:generate",
    "db:migrate": "npm --prefix backend run db:migrate",
    "db:seed": "npm --prefix backend run db:seed",
    "db:studio": "npm --prefix backend run db:studio",
    "db:reset": "npm --prefix backend run db:reset",

    "docker:up": "docker compose up -d --build",
    "docker:down": "docker compose down",
    "docker:reset": "docker compose down -v && docker compose up -d --build",
    "docker:logs": "docker compose logs -f",
    "docker:logs:backend": "docker compose logs -f backend",
    "docker:logs:frontend": "docker compose logs -f frontend",

    "clean": "rimraf backend/dist frontend/dist backend/coverage frontend/coverage",
    "postinstall": "npm --prefix backend install && npm --prefix frontend install"
  },
  "devDependencies": {
    "concurrently": "^9.1.0",
    "rimraf": "^6.0.1"
  },
  "keywords": ["docsob", "document-management"],
  "author": "DocsOb",
  "license": "ISC"
}
```

### 3.2 Tabela de Referência de Comandos

| Comando | Descrição | Ambiente |
| :--- | :--- | :---: |
| `npm run dev:all` | Inicia backend (3001) + frontend (5173) concorrentemente | Local |
| `npm run build:all` | Compila backend (TypeScript) e frontend (Vite) para produção | Local |
| `npm run test:all` | Executa suítes de teste do backend (140) e frontend (28+) | Local |
| `npm run test:e2e` | Executa testes E2E / smoke de integração full-stack | Local |
| `npm run db:migrate` | Executa migrações Prisma pendentes no banco local | Local |
| `npm run db:seed` | Executa seed idempotente (Admin, Operacional, Categorias) | Local |
| `npm run db:reset` | Reseta e re-semeia o banco de dados completamente | Local |
| `npm run docker:up` | Constrói e sobe todos os serviços Docker (PG + BE + FE) | Docker |
| `npm run docker:down` | Para e remove todos os containers | Docker |
| `npm run docker:reset` | Destrói volumes, reconstrói e sobe tudo do zero | Docker |
| `npm run docker:logs` | Exibe logs consolidados de todos os serviços em tempo real | Docker |
| `npm run clean` | Remove diretórios `dist/` e `coverage/` de ambos os módulos | Local |

---

## 🧪 4. Especificação dos Testes E2E / Integração Full-Stack

### 4.1 Estratégia e Ferramentas

| Aspecto | Decisão |
| :--- | :--- |
| **Tipo** | Testes de integração HTTP ponta a ponta (API-level E2E) |
| **Framework** | Vitest + Supertest (reutiliza o ecossistema já existente no backend) |
| **Localização** | `backend/tests/e2e/` (diretório dedicado) |
| **Banco** | PostgreSQL real (mesmo banco de testes ou banco ephemeral via Docker) |
| **Pré-condição** | Seed executado antes da suíte (`beforeAll` → `npx tsx prisma/seed.ts`) |
| **Autenticação** | Login via `POST /api/v1/auth/login` para obter JWT válido |
| **Execução** | `npm run test:e2e` (script dedicado no `backend/package.json`) |

### 4.2 Script Adicional no `backend/package.json`

```json
{
  "scripts": {
    "test:e2e": "vitest run --config vitest.e2e.config.ts"
  }
}
```

### 4.3 `backend/vitest.e2e.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    globalSetup: ['tests/e2e/global-setup.ts'],
  },
});
```

### 4.4 Arquivo de Setup Global (`tests/e2e/global-setup.ts`)

```typescript
/**
 * Executado UMA VEZ antes de toda a suíte E2E.
 * Garante que o banco está migrado e semeado com dados iniciais.
 */
export async function setup() {
  const { execSync } = await import('child_process');

  console.log('🔧 [E2E Setup] Aplicando migrações Prisma...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd() });

  console.log('🌱 [E2E Setup] Executando seed idempotente...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit', cwd: process.cwd() });
}

export async function teardown() {
  console.log('🧹 [E2E Teardown] Suíte E2E finalizada.');
}
```

### 4.5 Estrutura de Arquivos de Teste E2E

```
backend/tests/e2e/
├── global-setup.ts                    # Setup global: migra + semeia
├── helpers/
│   └── auth.helper.ts                 # Helper: login e obtenção de JWT (Admin / Operacional)
├── 01-auth-login.test.ts              # TC-E2E-01: Login com credenciais do seed
├── 02-dashboard-metrics.test.ts       # TC-E2E-02: Consulta de métricas do dashboard
├── 03-document-crud.test.ts           # TC-E2E-03: Cadastro de documento com anexo PDF
├── 04-document-renew.test.ts          # TC-E2E-04: Renovação e validação do histórico de versões
├── 05-calendar-events.test.ts         # TC-E2E-05: Consulta de eventos no calendário
├── 06-audit-logs.test.ts              # TC-E2E-06: Consulta de registros de auditoria com diff
├── 07-report-export.test.ts           # TC-E2E-07: Exportação de relatório CSV
└── 08-user-management.test.ts         # TC-E2E-08: Criação, reset de senha e inativação de usuário
```

### 4.6 Matriz de Testes E2E — Casos de Teste Detalhados

```
+===================================================================================================================+
|                                    MATRIZ DE TESTES E2E / SMOKE - FASE 4                                          |
+===========+=========================================+=======================================================+=====+
| ID        | Cenário de Teste                        | Critério de Sucesso Esperado                          | Prio|
+===========+=========================================+=======================================================+=====+
| TC-E2E-01 | Login com credenciais do Seed            | POST /api/v1/auth/login com admin@docsob.com.br /     | P0  |
|           | (Admin e Operacional)                   | Admin123!@# retorna 200 + JWT válido. GET /me retorna |     |
|           |                                         | dados do usuário logado com role correto.              |     |
+-----------+-----------------------------------------+-------------------------------------------------------+-----+
| TC-E2E-02 | Consulta de métricas do Dashboard       | GET /api/v1/dashboard/metrics retorna 200 com campos   | P0  |
|           | (statusCounts, complianceRate, etc.)    | statusCounts (5 chaves), totalActive ≥ 0,              |     |
|           |                                         | complianceRate 0–100 e byCategory como array.          |     |
+-----------+-----------------------------------------+-------------------------------------------------------+-----+
| TC-E2E-03 | Cadastro de documento com anexo PDF     | POST /api/v1/documents (multipart) com título,         | P0  |
|           | e listagem posterior                    | categoryId, issueDate e attachment retorna 201.         |     |
|           |                                         | GET /api/v1/documents lista o documento recém-criado.  |     |
+-----------+-----------------------------------------+-------------------------------------------------------+-----+
| TC-E2E-04 | Renovação de documento e validação      | POST /api/v1/documents/:id/renew retorna 200 com       | P0  |
|           | do histórico de versões                 | previousVersionNumber ≥ 1. GET /:id retorna            |     |
|           |                                         | versions[] com a versão anterior arquivada.            |     |
+-----------+-----------------------------------------+-------------------------------------------------------+-----+
| TC-E2E-05 | Consulta de eventos no Calendário       | GET /api/v1/calendar/events?month=M&year=Y retorna     | P1  |
|           | com filtro por mês/ano                  | array events[] com campos id, title, expirationDate    |     |
|           |                                         | e status. Filtro retorna subconjunto correto.          |     |
+-----------+-----------------------------------------+-------------------------------------------------------+-----+
| TC-E2E-06 | Consulta de registros de auditoria      | GET /api/v1/audit-logs retorna 200 com logs[] não      | P1  |
|           | com diffs (Admin Only, RBAC)            | vazio (ações CREATE/RENEW do TC-03/04). Operacional    |     |
|           |                                         | recebe 403. GET /:id retorna diffData com old/new.     |     |
+-----------+-----------------------------------------+-------------------------------------------------------+-----+
| TC-E2E-07 | Exportação de relatório CSV             | GET /api/v1/reports/export?format=csv retorna 200      | P1  |
|           | e validação de formato                  | com Content-Type text/csv e Content-Disposition com    |     |
|           |                                         | filename. Body contém cabeçalhos CSV esperados.        |     |
+-----------+-----------------------------------------+-------------------------------------------------------+-----+
| TC-E2E-08 | Gestão de usuários: criação, reset      | POST /api/v1/users cria novo usuário (201). PATCH      | P0  |
|           | de senha e inativação (Admin Only)      | /:id/password redefine senha (200). PATCH /:id/status  |     |
|           |                                         | inativa usuário (200). Operacional recebe 403 em tudo. |     |
+===========+=========================================+=======================================================+=====+
```

### 4.7 Helper de Autenticação (`tests/e2e/helpers/auth.helper.ts`)

```typescript
import supertest from 'supertest';
import { app } from '../../src/app.js';

const request = supertest(app);

export interface AuthTokens {
  adminToken: string;
  operationalToken: string;
}

/**
 * Autentica ambos os perfis do seed e retorna tokens JWT.
 */
export async function getAuthTokens(): Promise<AuthTokens> {
  const adminRes = await request
    .post('/api/v1/auth/login')
    .send({ email: 'admin@docsob.com.br', password: 'Admin123!@#' });

  const opRes = await request
    .post('/api/v1/auth/login')
    .send({ email: 'operacional@docsob.com.br', password: 'Operacional123!@#' });

  return {
    adminToken: adminRes.body.token,
    operationalToken: opRes.body.token,
  };
}
```

---

## 📖 5. Estrutura do `README.md` (Especificação de Conteúdo)

O `README.md` na raiz do repositório deve ser reescrito com a seguinte estrutura:

```markdown
# DocsOb — Sistema de Gestão de Vencimento de Documentos

> Plataforma web moderna para controle, acompanhamento e renovação de
> documentos corporativos com Matriz de Cores visual, alertas automáticos,
> sincronização com Google Agenda e trilha de auditoria imutável.

## Sumário
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Início Rápido com Docker](#início-rápido-com-docker)
- [Início Rápido Local](#início-rápido-local)
- [Credenciais do Seed](#credenciais-do-seed)
- [Comandos Úteis](#comandos-úteis)
- [API Endpoints](#api-endpoints)
- [Testes](#testes)
- [Documentação Técnica](#documentação-técnica)

## Arquitetura
[Diagrama Mermaid com blocos: Browser → Nginx/Frontend → Backend API → PostgreSQL]
[Descrição dos 3 serviços Docker e comunicação via rede interna]

## Tecnologias
| Camada     | Tecnologia                                               |
|------------|----------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, Recharts       |
| Backend    | Node.js 20, Express, TypeScript, Prisma ORM, Zod         |
| Banco      | PostgreSQL 16                                            |
| Auth       | JWT (jsonwebtoken) + BCrypt                              |
| Storage    | Disco local /uploads (Multer, limite 10 MB)              |
| Infra      | Docker, Docker Compose, Nginx Alpine                     |

## Início Rápido com Docker
```bash
git clone <repo-url> && cd docsob
docker compose up -d --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

## Início Rápido Local (Sem Docker)
```bash
npm install           # Instala dependências raiz + backend + frontend
cp .env.example backend/.env
docker compose up -d postgres   # Apenas o banco
npm run db:migrate    # Aplica migrações
npm run db:seed       # Semeia dados iniciais
npm run dev:all       # Backend + Frontend concorrentes
```

## Credenciais do Seed
| Perfil       | E-mail                      | Senha            | Role          |
|--------------|-----------------------------|------------------|---------------|
| Administrador| admin@docsob.com.br         | Admin123!@#      | ADMIN         |
| Operacional  | operacional@docsob.com.br   | Operacional123!@#| OPERATIONAL   |

## Comandos Úteis
[Tabela com todos os scripts do package.json — mesma da seção 3.2 deste plano]

## API Endpoints
[Tabela resumida de todos os endpoints organizados por módulo]

## Testes
```bash
npm run test:all      # 140 testes backend + 28 testes frontend
npm run test:e2e      # 8 cenários E2E de integração full-stack
```

## Documentação Técnica
- [PRD — Requisitos do Produto](docs/PRD.md)
- [Arquitetura Técnica](docs/ARCHITECTURE.md)
```

---

## ⚠️ 6. Matriz de Riscos e Mitigações

| # | Risco Identificado | Probabilidade | Impacto | Mitigação |
| :---: | :--- | :---: | :---: | :--- |
| R1 | **Prisma `migrate deploy` falha no entrypoint** porque o PostgreSQL ainda não aceitou conexões apesar do healthcheck | Média | Alto | `depends_on: condition: service_healthy` + `start_period: 10s` no PG; retry no entrypoint com `sleep 2 && npx prisma migrate deploy` em loop de até 5 tentativas |
| R2 | **Compilação nativa de `bcryptjs` falha no Alpine** por ausência de libs C | Baixa | Alto | `bcryptjs` (JavaScript puro, sem binding nativo) já é a dependência utilizada — não requer `python3` ou `make`; validar na primeira build |
| R3 | **Frontend build falha por variável `VITE_API_URL` indefinida** | Baixa | Médio | Declarada como `ARG` no Dockerfile com valor default `/api/v1`; Nginx faz proxy reverso transparente |
| R4 | **Uploads perdidos ao recriar container backend** | Média | Alto | Volume nomeado `docsob_uploads` montado em `/app/uploads`; `docker compose down` preserva volumes; apenas `down -v` destrói |
| R5 | **Testes E2E interferem em dados de produção** | Média | Crítico | Testes E2E rodam contra banco local de desenvolvimento, **nunca** contra produção; variável `DATABASE_URL` isolada; cleanup em `afterAll` dos testes que criam dados temporários |
| R6 | **Seed executa em duplicata e causa conflito de e-mail** | Baixa | Baixo | Seed é idempotente — verifica existência antes de criar (`findUnique` + condicional); entrypoint tolerante a falhas com `|| echo` |
| R7 | **Porta 3000/3001/5432 já ocupada no host** | Média | Baixo | Documentar portas no README; orientar `docker compose` com mapeamento alternativo (`3100:80` etc.) se necessário |

---

## 🚀 7. Critérios de Aceite da Fase 4 (Definition of Done — DoD)

### 7.1 Dockerização
- [ ] `docker compose up -d --build` sobe os 3 serviços (postgres, backend, frontend) sem erros em máquina limpa.
- [ ] Healthchecks dos 3 serviços retornam `healthy` em até 90 segundos.
- [ ] `http://localhost:3001/api/v1/health` retorna `{"status":"ok"}`.
- [ ] `http://localhost:3000` serve a SPA React corretamente (login funcional).
- [ ] Proxy reverso Nginx (`/api/v1/*`) encaminha corretamente para o backend.
- [ ] Upload de documento via frontend Docker persiste arquivo no volume `docsob_uploads`.
- [ ] `docker compose down` + `docker compose up -d` mantém dados no PostgreSQL e uploads no volume.
- [ ] `docker compose down -v` destrói volumes e `up --build` reconstrói tudo do zero com seed funcional.

### 7.2 Scripts Unificados
- [ ] `npm run dev:all` inicia backend e frontend concorrentemente sem erro.
- [ ] `npm run build:all` compila backend (TypeScript → `dist/`) e frontend (Vite → `dist/`) com zero erros.
- [ ] `npm run test:all` executa 140+ testes backend + 28+ testes frontend com 100% de aprovação.
- [ ] `npm run docker:up` é equivalente a `docker compose up -d --build`.
- [ ] `npm run docker:reset` destrói volumes e reconstrói tudo.
- [ ] `npm run clean` remove diretórios `dist/` e `coverage/`.

### 7.3 Testes E2E / Smoke
- [ ] `npm run test:e2e` executa 8 cenários de integração full-stack com 100% de aprovação.
- [ ] TC-E2E-01: Login Admin e Operacional retornam JWT válido.
- [ ] TC-E2E-03: Cadastro de documento com upload multipart retorna 201 e documento aparece na listagem.
- [ ] TC-E2E-04: Renovação gera snapshot no histórico de versões.
- [ ] TC-E2E-06: RBAC bloqueia acesso de Operacional à trilha de auditoria (403).
- [ ] TC-E2E-08: Auto-inativação do próprio admin é bloqueada (400).

### 7.4 Documentação
- [ ] `README.md` contém guia Docker e Local completo e funcional.
- [ ] Tabela de credenciais do seed presente e correta.
- [ ] Tabela de comandos úteis presente e refletindo os scripts reais.

---

## 📅 8. Cronograma de Implementação e Tarefas Kanban

| ID Tarefa | Título da Tarefa | Responsável | Dependência | Status |
| :--- | :--- | :---: | :---: | :---: |
| `T-F4-01` | **Dockerfile do Backend** (multi-stage, entrypoint com migrate + seed) | Implementer | Fase 2+3 | `ready` |
| `T-F4-02` | **Dockerfile do Frontend** (multi-stage Vite → Nginx Alpine + `nginx.conf`) | Implementer | `T-F4-01` | `ready` |
| `T-F4-03` | **Docker Compose Full-Stack** (PG + Backend + Frontend + volumes + healthchecks) | Implementer | `T-F4-02` | `ready` |
| `T-F4-04` | **`.dockerignore`** para backend e frontend | Implementer | `T-F4-01` | `ready` |
| `T-F4-05` | **Scripts Unificados no `package.json` Raiz** (dev:all, build:all, test:all, docker:*) | Implementer | `T-F4-03` | `ready` |
| `T-F4-06` | **Configuração Vitest E2E** (`vitest.e2e.config.ts`, global-setup, auth helper) | Implementer | `T-F4-01` | `ready` |
| `T-F4-07` | **Testes E2E: Auth + Dashboard + CRUD Documento** (TC-E2E-01 a TC-E2E-03) | Implementer | `T-F4-06` | `ready` |
| `T-F4-08` | **Testes E2E: Renovação + Calendário + Auditoria** (TC-E2E-04 a TC-E2E-06) | Implementer | `T-F4-07` | `ready` |
| `T-F4-09` | **Testes E2E: Relatórios + Usuários + RBAC** (TC-E2E-07 a TC-E2E-08) | Implementer | `T-F4-08` | `ready` |
| `T-F4-10` | **README.md Completo** (arquitetura, Docker, local, credenciais, comandos) | Implementer | `T-F4-05` | `ready` |
| `T-F4-11` | **Validação de Integração Final** (Docker up limpo + test:all + test:e2e) | Implementer/QA | `T-F4-09`, `T-F4-10` | `ready` |
