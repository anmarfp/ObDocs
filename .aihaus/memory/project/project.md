# Project

## Purpose
DocsOb é um sistema de gestão e acompanhamento proativo de datas de vencimento de documentos (certidões, contratos, licenças, apólices de seguro, etc.) para evitar multas e riscos operacionais.

- **source:** docs/PRD.md (commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)

## Users and outcomes
- **Administrador / Gestor:** Diretores e gerentes com acesso total, relatórios, configurações e visão consolidada.
- **Operacional / Analista:** Assistentes/analistas que realizam cadastro, upload e atualizações.
- **Leitor / Auditor:** Consulta somente leitura para auditoria e download de documentos válidos.

- **source:** docs/PRD.md (commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)

## In scope
- Cadastro de documentos com tipo/categoria obrigatório, anexo até 10 MB (PDF, PNG, JPG).
- Dashboard visual com matriz de status por cores (🔴 Vencido, 🟡 Crítico, 🔵 Em Renovação, 🟢 Regular, ⚪ Indeterminado).
- Notificações automáticas por e-mail enviadas ao responsável com antecedência customizável por documento.
- Histórico auditável de renovações e exclusão permanente (Hard Delete) por administradores.
- Autenticação e controle de perfis de usuário em modelo empresa única (Single-Tenant).

- **source:** docs/PRD.md (commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)

## Out of scope
- Suporte a múltiplas empresas/filiais (Multi-tenant) no MVP.
- Notificações via WhatsApp.
- Leitura automática de PDF via OCR.
- Integração via API direta com órgãos emissores.

- **source:** docs/PRD.md (commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)

## Definition of Done
- 100% dos documentos cadastrados geram alertas prévios.
- Consulta e localização de documentos em menos de 5 segundos.
- Visibilidade em tempo real no Dashboard.

- **source:** docs/PRD.md (commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)

## Current constraints
- MVP focado em empresa única.
- Notificações exclusivamente via e-mail.
- Arquivos anexos limitados a 10 MB.

- **source:** docs/PRD.md (commit `cdb3ef52c66821e857d8ecb7002a8c991acfd411`)
