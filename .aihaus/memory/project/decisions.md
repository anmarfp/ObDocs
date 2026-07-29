# Decisions

## ADR-001 — Canal Exclusivo de Notificação por E-mail no MVP

**Status:** accepted
**Date:** 2026-07-29
**Milestone:** MVP
**Amends:** none

Related rules: BR-003

### Context
Necessidade de estabelecer um canal confiável de alertas de vencimento para o MVP sem adicionar complexidade técnica de APIs de terceiros.

### Decision
Utilizar exclusivamente e-mail como canal de notificação para a versão MVP. Integrações como WhatsApp foram diferidas para o pós-MVP. (Source: docs/PRD.md at commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)

### Consequences
Reduz a complexidade de integração no lançamento inicial e garante entrega previsível.

### Reversal or migration
Caso haja demanda crítica post-MVP, integrar gateway de mensagens via WhatsApp API.

## ADR-002 — Modelo de Acesso Aberto sem Restrição por Setor no MVP

**Status:** accepted
**Date:** 2026-07-29
**Milestone:** MVP
**Amends:** none

Related rules: none

### Context
Definição do modelo de segurança e visibilidade por departamento na primeira versão.

### Decision
Não aplicar restrição de visualização por setor/departamento no MVP. Todos os usuários administrativos compartilham visualização do repositório. (Source: docs/PRD.md at commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)

### Consequences
Interface e modelo de dados simplificados para a primeira versão.

### Reversal or migration
Implementar controle de permissões por grupo/setor (RBAC refinado) em versões futuras se necessário.
