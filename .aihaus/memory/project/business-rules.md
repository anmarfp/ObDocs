# Business rules

Markdown is authoritative; indexes only retrieve it.

## Accepted rules

### BR-001 — Recálculo Automático de Status

- **status:** accepted
- **domain:** document-management
- **statement:** O status visual do documento deve ser recalculado automaticamente a cada mudança de dia à meia-noite.
- **source:** docs/PRD.md (RN-001, commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)
- **rationale:** Manter a matriz de status atualizada diariamente sem intervenção manual.
- **last-reviewed:** cdb3ef52c66821e857d8ecb7002a8c991acfd411
- **links:** implements: [RF-004], relates: [], decided-by: []

- Given a change of date at midnight When the automated daily routine executes Then the visual status of all active documents is updated.

### BR-002 — Imutabilidade do Histórico de Renovações

- **status:** accepted
- **domain:** document-management
- **statement:** Documentos substituídos por uma nova renovação não podem ser excluídos, apenas arquivados no histórico.
- **source:** docs/PRD.md (RN-002, commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)
- **rationale:** Garantir a rastreabilidade e auditabilidade histórica das versões anteriores dos documentos.
- **last-reviewed:** cdb3ef52c66821e857d8ecb7002a8c991acfd411
- **links:** implements: [RF-003], relates: [], decided-by: []

- Given an existing document When a new renewal is registered Then the previous version is archived in the history log and linked to the new version.

### BR-003 — Obrigatoriedade de E-mail do Responsável

- **status:** accepted
- **domain:** notifications
- **statement:** Todo documento com data de vencimento preenchida obrigatoriamente vincula o e-mail do responsável para envio dos alertas.
- **source:** docs/PRD.md (RN-003, RN-004, commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)
- **rationale:** Garantir o direcionamento de notificações para o responsável pelo acompanhamento daquele documento.
- **last-reviewed:** cdb3ef52c66821e857d8ecb7002a8c991acfd411
- **links:** implements: [RF-007], relates: [], decided-by: []

- Given a document with an expiration date When saving the document Then the responsible email must be valid and non-empty.

### BR-004 — Escopo de Empresa Única (Single-Tenant no MVP)

- **status:** accepted
- **domain:** architecture
- **statement:** O MVP atenderá a uma única estrutura organizacional/empresa (suporte a múltiplas empresas/filiais post-MVP).
- **source:** docs/PRD.md (RN-005, commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)
- **rationale:** Simplificar o escopo da primeira versão funcional.
- **last-reviewed:** cdb3ef52c66821e857d8ecb7002a8c991acfd411
- **links:** implements: [], relates: [], decided-by: []

- Given an authenticated user When accessing the application Then they access the single organization document repository.

## Conflicts and gaps

None identified.
