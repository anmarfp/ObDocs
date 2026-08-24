---
type: business-rule
owner: product
status: draft
last_reviewed: 2026-08-24
---

# Business Rules

> **This page is the apex of truth.** When code, a decision, or an agent's behavior conflicts with an accepted rule here, the rule wins. Rules say *what must be true*, never *how to implement it*.

## Current truth

_No accepted business rules recorded yet (awaiting user approval of candidate rules below)._

## Proposed Business Rules (Awaiting User Approval)

### RN-001 — Troca Automática de Status
- domain: software | compliance
- statement: O status visual do documento deve ser recalculado automaticamente a cada mudança de dia à meia-noite (🔴 Vencido, 🟡 Alerta Crítico, 🔵 Em Renovação, 🟢 Regular, ⚪ Indeterminado).
- scenario: Given um documento cadastrado, When passa a meia-noite, Then o status visual é recalculado com base na data de vencimento e lead time de alerta.
- status: proposed
- source: docs/PRD.md:105 (RN-001)

### RN-002 — Imutabilidade do Histórico de Renovações
- domain: data | compliance
- statement: Documentos substituídos por uma nova renovação não podem ser excluídos, devendo ser mantidos no histórico de versões auditável.
- scenario: Given um documento renovado, When uma nova versão é inserida, Then a versão anterior é mantida imutável no histórico.
- status: proposed
- source: docs/PRD.md:106 (RN-002)

### RN-003 — Alerta Obrigatório
- domain: software
- statement: Todo documento com data de vencimento preenchida obrigatoriamente gera alertas prévios de vencimento.
- scenario: Given um documento com data de vencimento, When a antecedência configurada é atingida, Then o alerta de e-mail e evento na agenda são disparados.
- status: proposed
- source: docs/PRD.md:107 (RN-003)

### RN-004 — Condicional de Responsável x Configuração da Empresa
- domain: software | design
- statement: Se a empresa estiver no modo 'Notificar Todos os Administradores', o campo Responsável é omitido no cadastro; se estiver em 'Notificar Apenas Responsável', o campo é exibido e obrigatório.
- scenario: Given o modo de notificação da empresa, When o formulário de cadastro é aberto, Then o campo Responsável exibe comportamento condicional de visibilidade e obrigatoriedade.
- status: proposed
- source: docs/PRD.md:108 (RN-004)

### RN-005 — Escopo Único de Empresa (Single-Tenant no MVP)
- domain: software | architecture
- statement: O MVP atende uma única estrutura organizacional (empresa única).
- status: proposed
- source: docs/PRD.md:111 (RN-005)

### RN-006 — Visibilidade Restrita de Arquivados
- domain: security | compliance
- statement: Documentos com status Arquivado (Soft Delete) são ocultados para perfil Operacional e acessíveis exclusivamente para Administradores.
- scenario: Given um documento arquivado, When um usuário Operacional visualiza a listagem, Then o documento arquivado não é exibido.
- status: proposed
- source: docs/PRD.md:112 (RN-006)

### RN-007 — Sincronização em Tempo Real no Google Agenda
- domain: software
- statement: A criação ou alteração da data de vencimento de um documento cria ou atualiza automaticamente o evento no Google Agenda do administrador.
- status: proposed
- source: docs/PRD.md:113 (RN-007)

### RN-008 — Registro Obrigatório de Audit Log Imutável
- domain: security | compliance
- statement: Qualquer criação, edição, renovação, arquivamento ou exclusão deve registrar no log de auditoria o ID do usuário, data/hora e o diff detalhado dos valores alterados.
- status: proposed
- source: docs/PRD.md:114 (RN-008)

### RN-009 — Restrição de Gestão de Usuários (RBAC)
- domain: security
- statement: Apenas usuários com o papel Administrador possuem permissão para acessar o módulo de gestão de usuários, atribuição de roles e inativação de contas.
- status: proposed
- source: docs/PRD.md:115 (RN-009)

## Open questions

- Awaiting user approval to accept RN-001 through RN-009.

## Links

- docs/PRD.md · docs/ARCHITECTURE.md
- decisions: decisions.md

## Timeline

- 2026-08-24 — Proposed business rules RN-001 through RN-009 extracted from PRD v0.2.0.
- 2026-06-23 — Seeded from the aihaus-okf project template.
