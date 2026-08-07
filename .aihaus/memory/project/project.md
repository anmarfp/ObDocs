# Project

## Etapa atual do ciclo de desenvolvimento

- **Etapa:** 2.0 — Design, Arquitetura e Prototipagem da UI.
- **Status:** em andamento (autorizada transição para a Etapa 2 pelo stakeholder).
- **Próxima transição:** finalizar o protótipo funcional/interativo da UI do DocsOb com base nos requisitos e MVP consolidados.
- **Regra de acompanhamento:** ao iniciar ou concluir uma etapa, atualizar esta seção no mesmo trabalho. Esta é a fonte única da etapa atual do projeto.
- **source:** autorização do stakeholder em 2026-08-07; docs/PRD.md (Fase 2).

## Purpose
DocsOb é um sistema de gestão e acompanhamento proativo de datas de vencimento de documentos (certidões, contratos, licenças, apólices de seguro, etc.) para evitar multas e riscos operacionais.

- **source:** docs/PRD.md (commit `0d44a34` / v0.2.0)

## Users and outcomes
- **Administrador / Gestor:** Diretores e gerentes com acesso total, configurações de notificação da empresa, relatórios, gestão de usuários, documentos arquivados e trilha de auditoria.
- **Operacional / Analista:** Assistentes e analistas que realizam cadastro, upload, atualização e arquivamento de documentos.

- **source:** docs/PRD.md (commit `0d44a34` / v0.2.0)

## In scope
- Cadastro de documentos com tipo/categoria obrigatório, data de vencimento e anexo até 10 MB (PDF, PNG, JPG).
- Dashboard visual com matriz de status por cores (🔴 Vencido, 🟡 Crítico, 🔵 Em Renovação, 🟢 Regular, ⚪ Indeterminado).
- Configuração de notificação por empresa: Notificar todos os Admins (oculta responsável) VS Notificar apenas o Responsável.
- Sincronização automática e visualização de eventos com Google Agenda (RF-005).
- Sistema de auditoria e histórico de alterações detalhado (Audit Log - RF-013).
- Arquivamento de documentos (Soft Delete restrito a Administradores) e exclusão permanente (Hard Delete).
- Autenticação com 2 perfis de acesso (Administrador e Operacional) em modelo Single-Tenant.

- **source:** docs/PRD.md (commit `0d44a34` / v0.2.0)

## Out of scope
- Perfil de acesso Leitor/Auditor (revolvido/descontinuado).
- Suporte a múltiplas empresas/filiais (Multi-tenant) no MVP.
- Notificações via WhatsApp.
- Leitura automática de PDF via OCR.
- Integração via API direta com órgãos emissores.

- **source:** docs/PRD.md (commit `0d44a34` / v0.2.0)

## Definition of Done
- 100% dos documentos cadastrados geram alertas prévios e eventos no Google Agenda.
- Log de auditoria mantido para 100% das alterações de documentos.
- Consulta e localização de documentos em menos de 5 segundos.
- Visibilidade em tempo real no Dashboard.

- **source:** docs/PRD.md (commit `0d44a34` / v0.2.0)

## Current constraints
- MVP focado em empresa única.
- 2 perfis de usuário (Admin e Operacional).
- Notificações exclusivamente via e-mail.
- Arquivos anexos limitados a 10 MB.

- **source:** docs/PRD.md (commit `0d44a34` / v0.2.0)
