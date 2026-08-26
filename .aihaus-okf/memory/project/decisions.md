---
type: decision
owner: architecture
status: active
last_reviewed: 2026-08-24
---

# Decisions — ADR Ledger

> Decision record for DocsOb project. Newest entries on top.

## Current truth

Key architectural decisions are recorded in `docs/ARCHITECTURE.md` and `docs/PRD.md`.

## Details

### 2026-08-24 — Estratégia de Banco de Dados e Storage Local-First (ADR-007)
- **Context:** Necessidade de rodar o banco de dados e armazenamento de arquivos 100% localmente para manter custo zero na fase de desenvolvimento, com migração simplificada para a nuvem no futuro.
- **Decision:** Utilizar PostgreSQL local (via Docker Compose / serviço local) com Prisma ORM e armazenamento de anexos no disco local (`./uploads/` com interface abstraída `IStorageService`). A migração futura para nuvem (Supabase / AWS RDS / S3) será feita apenas alterando variáveis de ambiente (`DATABASE_URL`), sem necessidade de refatoração do código.
- **Status:** Accepted
- **Links:** `docs/ARCHITECTURE.md:340`, `docs/PRD.md:149`

### 2026-08-23 — UI Prototype Theme and Palette Standardization
- **Context:** User requested standardizing the wireframe prototype palette across all screens and maintaining only the `perspective_dashboard` workspace.
- **Decision:** Adopted the 6-tone design palette (`#021024` Dark Navy, `#052659` Deep Navy, `#5483B3` Slate Blue, `#7DA0CA` Soft Blue, `#C1E8FF` Ice Light Blue) and deleted `perspective_executive` & `perspective_timeline` to focus development on `perspective_dashboard`.
- **Status:** Accepted
- **Links:** `wireframes/perspective_dashboard/styles.css`

### 2026-08-07 — Arquitetura Desacoplada REST/SPA e Estratégia de Prototipagem da UI (ADR-006)
- **Context:** Início da Fase 2 para definir a arquitetura técnica, o modelo de dados (ERD) e preparar a prototipagem de UI do DocsOb.
- **Decision:** Adoção de arquitetura desacoplada (Frontend SPA Web + Backend RESTful API + Banco Relacional PostgreSQL com ORM Prisma + Storage S3/Supabase + Google Calendar API). Para o protótipo de UI, construir uma SPA Web interativa com design system rico em Vanilla CSS.
- **Status:** Accepted
- **Links:** `docs/ARCHITECTURE.md:340`

### 2026-07-31 — Trilha de Auditoria com Log de Alterações Detalhado (Audit Log - ADR-005)
- **Context:** Necessidade de garantir transparência e rastreabilidade sobre quem alterou dados ou substituiu anexos de um documento.
- **Decision:** Criar tabela e aba visual de Auditoria no detalhe do documento exibindo quem editou, data/hora e o histórico exato de campos alterados (de/para).
- **Status:** Accepted
- **Links:** `docs/PRD.md:81`, `docs/ARCHITECTURE.md:230`

### 2026-07-31 — Seletor de Configuração Global de Notificação por Empresa (ADR-004)
- **Context:** Empresas possuem dinâmicas distintas (responsável centralizado vs descentralizado).
- **Decision:** Criar uma chave seletora global por empresa que define se todos os administradores recebem as notificações (ocultando o campo Responsável no formulário) ou se apenas o e-mail do Responsável cadastrado recebe os alertas (exibindo o campo Responsável).
- **Status:** Accepted
- **Links:** `docs/PRD.md:75`, `docs/ARCHITECTURE.md:166`

### 2026-07-31 — Integração com Google Agenda no Calendário de Vencimentos (ADR-003)
- **Context:** Necessidade de integrar os vencimentos ao ecossistema de produtividade do Administrador.
- **Decision:** Implementar sincronização automática de eventos no Google Agenda a partir da inclusão/alteração de documentos com data de vencimento (RF-005).
- **Status:** Accepted
- **Links:** `docs/PRD.md:66`, `docs/ARCHITECTURE.md:144`

### 2026-07-29 — Modelo de Acesso Aberto sem Restrição por Setor no MVP (ADR-002)
- **Context:** Definição do modelo de segurança e visibilidade por departamento na primeira versão.
- **Decision:** Não aplicar restrição de visualização por setor/departamento no MVP. Todos os usuários administrativos compartilham visualização do repositório geral.
- **Status:** Accepted
- **Links:** `docs/PRD.md:140`

### 2026-07-29 — Canal Exclusivo de Notificação por E-mail no MVP (ADR-001)
- **Context:** Necessidade de estabelecer um canal confiável de alertas de vencimento para o MVP sem adicionar complexidade técnica de APIs de terceiros.
- **Decision:** Utilizar exclusivamente e-mail como canal de notificação para a versão MVP. Integrações como WhatsApp foram diferidas para o pós-MVP.
- **Status:** Accepted
- **Links:** `docs/PRD.md:73`

## Open questions

- Backend framework selection (Express vs NestJS) for Phase 3 implementation.

## Links

- PRD: [docs/PRD.md](file:///C:/Users/Marco/orca/workspaces/ObDocs/huchen/docs/PRD.md)
- Architecture: [docs/ARCHITECTURE.md](file:///C:/Users/Marco/orca/workspaces/ObDocs/huchen/docs/ARCHITECTURE.md)

## Timeline

- 2026-08-24 — Migrated ADR-001 through ADR-006 from legacy .aihaus memory and merged into .aihaus-okf/memory/project/decisions.md.
- 2026-06-23 — Seeded from the aihaus-okf project template.
