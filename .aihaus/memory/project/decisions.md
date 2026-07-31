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
Utilizar exclusivamente e-mail como canal de notificação para a versão MVP. Integrações como WhatsApp foram diferidas para o pós-MVP. (Source: docs/PRD.md)

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
Não aplicar restrição de visualização por setor/departamento no MVP. Todos os usuários administrativos compartilham visualização do repositório. (Source: docs/PRD.md)

### Consequences
Interface e modelo de dados simplificados para a primeira versão.

### Reversal or migration
Implementar controle de permissões por grupo/setor (RBAC refinado) em versões futuras se necessário.

## ADR-003 — Integração com Google Agenda no Calendário de Vencimentos

**Status:** accepted
**Date:** 2026-07-31
**Milestone:** MVP
**Amends:** none

Related rules: BR-006

### Context
Necessidade de integrar os vencimentos ao ecossistema de produtividade do Administrador.

### Decision
Implementar sincronização automática de eventos no Google Agenda a partir da inclusão de documentos com data de vencimento (RF-005).

### Consequences
Garante que o administrador receba notificações no celular/agenda além dos e-mails.

### Reversal or migration
Manter fallback para visualização interna no calendário do app caso a API do Google esteja indisponível.

## ADR-004 — Seletor de Configuração Global de Notificação por Empresa

**Status:** accepted
**Date:** 2026-07-31
**Milestone:** MVP
**Amends:** none

Related rules: BR-003

### Context
Empresas possuem dinâmicas distintas: algumas possuem um responsável específico por documento, enquanto outras descentralizam para toda a diretoria/administração.

### Decision
Criar uma chave seletora global por empresa que define se todos os administradores recebem as notificações (ocultando o campo Responsável no formulário) ou se apenas o e-mail do Responsável cadastrado recebe os alertas (exibindo o campo Responsável).

### Consequences
Flexibilidade total para o modelo operacional do cliente sem necessidade de customização de código.

### Reversal or migration
Expansão futura para regras mistas por categoria de documento.

## ADR-005 — Trilha de Auditoria com Log de Alterações Detalhado (Audit Log)

**Status:** accepted
**Date:** 2026-07-31
**Milestone:** MVP
**Amends:** none

Related rules: BR-007

### Context
Necessidade de garantir transparência e rastreabilidade sobre quem alterou dados ou substituiu anexos de um documento.

### Decision
Criar tabela e aba visual de Auditoria no detalhe do documento exibindo quem editou, data/hora e o histórico exato de campos alterados (de/para).

### Consequences
Conformidade e segurança operacional para auditorias administrativas.

### Reversal or migration
Nenhuma. O log é acumulativo e imutável.
