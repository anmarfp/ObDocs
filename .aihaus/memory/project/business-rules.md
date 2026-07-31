# Business rules

Markdown is authoritative; indexes only retrieve it.

## Accepted rules

### BR-001 — Recálculo Automático de Status

- **status:** accepted
- **domain:** document-management
- **statement:** O status visual do documento deve ser recalculado automaticamente a cada mudança de dia à meia-noite.
- **source:** docs/PRD.md (RN-001)
- **rationale:** Manter a matriz de status atualizada diariamente sem intervenção manual.
- **last-reviewed:** v0.2.0
- **links:** implements: [RF-004], relates: [], decided-by: []

- Given a change of date at midnight When the automated daily routine executes Then the visual status of all active documents is updated.

### BR-002 — Imutabilidade do Histórico de Renovações

- **status:** accepted
- **domain:** document-management
- **statement:** Documentos substituídos por uma nova renovação não podem ser excluídos, apenas arquivados no histórico de versões.
- **source:** docs/PRD.md (RN-002)
- **rationale:** Garantir a rastreabilidade e auditabilidade histórica das versões anteriores dos documentos.
- **last-reviewed:** v0.2.0
- **links:** implements: [RF-003], relates: [], decided-by: []

- Given an existing document When a new renewal is registered Then the previous version is archived in the history log and linked to the new version.

### BR-003 — Configuração Condicional de Notificação por Empresa

- **status:** accepted
- **domain:** notifications
- **statement:** Se a empresa estiver configurada para 'Notificar todos os Administradores', o campo Responsável é omitido no cadastro e todos os admins são notificados; se configurada para 'Notificar Responsável', o campo Responsável é exibido e obrigatório.
- **source:** docs/PRD.md (RN-004, RF-012)
- **rationale:** Permitir flexibilidade no fluxo de comunicação da empresa.
- **last-reviewed:** v0.2.0
- **links:** implements: [RF-007, RF-012], relates: [], decided-by: [ADR-004]

- Given the company notification setting When registering a document Then the form visibility of the Responsible field and email alert targets adapt dynamically.

### BR-004 — Escopo de Empresa Única (Single-Tenant no MVP)

- **status:** accepted
- **domain:** architecture
- **statement:** O MVP atenderá a uma única estrutura organizacional/empresa (suporte a múltiplas empresas/filiais post-MVP).
- **source:** docs/PRD.md (RN-005)
- **rationale:** Simplificar o escopo da primeira versão funcional.
- **last-reviewed:** v0.2.0
- **links:** implements: [], relates: [], decided-by: []

- Given an authenticated user When accessing the application Then they access the single organization document repository.

### BR-005 — Visibilidade Restrita de Documentos Arquivados

- **status:** accepted
- **domain:** security-and-access
- **statement:** Documentos em status 'Arquivado' (Soft Delete) são ocultados para usuários Operacionais e exibidos apenas para perfil Administrador.
- **source:** docs/PRD.md (RN-006, RF-011)
- **rationale:** Evitar poluição da visão operacional e resguardar arquivos desativados para acesso exclusivo de gestão.
- **last-reviewed:** v0.2.0
- **links:** implements: [RF-011], relates: [], decided-by: []

- Given an archived document When an Operational user accesses the system Then the archived document is not visible in lists or searches.

### BR-006 — Sincronização Automática com Google Agenda

- **status:** accepted
- **domain:** integrations
- **statement:** A criação ou alteração de data de vencimento de um documento gera/atualiza automaticamente o evento no Google Agenda do Administrador.
- **source:** docs/PRD.md (RN-007, RF-005)
- **rationale:** Notificação proativa no ecossistema de calendário do gestor.
- **last-reviewed:** v0.2.0
- **links:** implements: [RF-005], relates: [], decided-by: [ADR-003]

- Given a document with an expiration date When saved or updated Then an event is synchronized with Google Calendar.

### BR-007 — Trilha de Auditoria Obrigatória (Audit Log)

- **status:** accepted
- **domain:** auditability
- **statement:** Qualquer alteração em campos de um documento registra imutavelmente o ID do usuário, data/hora e o histórico exato de valores alterados (de/para).
- **source:** docs/PRD.md (RN-008, RF-013)
- **rationale:** Rastreabilidade completa de ações e alterações no acervo documental.
- **last-reviewed:** v0.2.0
- **links:** implements: [RF-013], relates: [], decided-by: [ADR-005]

- Given a document edit action When saved Then an immutable audit log entry is generated detailing changed fields.

## Conflicts and gaps

None identified.
