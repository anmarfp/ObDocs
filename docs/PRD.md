# PRD - Documento de Requisitos do Produto
## Sistema de Gestão e Acompanhamento de Vencimento de Documentos (DocsOb)

| Informação | Detalhe |
| :--- | :--- |
| **Projeto** | DocsOb - Gestão de Vencimento de Documentos |
| **Fase Atual** | Fase 1: Análise e Levantamento de Requisitos |
| **Status** | Em Elaboração / Validação |
| **Versão** | 0.2.0 |
| **Última Atualização** | 2026-07-31 |

---

## 1. Visão Geral e Problema

### 1.1 Contexto e Problema
Na administração diária de empresas, o acompanhamento manual de datas de vencimento de documentos (como certidões negativas, licenças de operação, contratos de fornecedores, obrigações trabalhistas, apólices de seguro, licenças sanitárias/ambientais, entre outros) através de planilhas desatualizadas ou e-mails causa retrabalho e riscos operacionais graves. A perda de prazos resulta em multas, suspensão de alvarás, bloqueios contratuais e impedimento de participação em licitações.

### 1.2 Solução Proposta
Desenvolver um aplicativo web/mobile intuitivo, focado na visualização rápida e proativa do status de vencimento dos documentos da empresa, com sistema visual por cores, alertas automáticos multicanal, sincronização com Google Agenda, trilha de auditoria e gestão de renovações.

---

## 2. Objetivos e Métricas de Sucesso

- **Zero Vencimentos Não Detectados**: Garantir que 100% dos documentos cadastrados gerem alertas prévios e eventos no Google Agenda.
- **Redução de Tempo de Consulta**: Permitir que qualquer documento ou certidão seja localizado em menos de 5 segundos.
- **Rastreabilidade e Segurança**: Manter log de auditoria imutável para 100% das edições e alterações de documentos.
- **Visibilidade Executiva**: Oferecer aos gestores um Dashboard em tempo real sobre a saúde documental da empresa.

---

## 3. Personas e Perfis de Usuários

| Perfil | Descrição | Permissões / Necessidades |
| :--- | :--- | :--- |
| **Administrador / Gestor** | Diretores, gerentes e administradores do sistema. | Acesso total ao sistema, configurações de notificação por empresa, relatórios, gestão de usuários, visualização de documentos arquivados e logs de auditoria. |
| **Operacional / Analista** | Assistentes e analistas administrativos. | Cadastro de documentos, upload de anexos, atualização de datas, inclusão de comprovantes de renovação e arquivamento de documentos. *(Não visualiza documentos arquivados nem edita configurações globais)*. |

---

## 4. Requisitos Funcionais (RF)

### 4.1 Módulo de Cadastro e Armazenamento
- **[RF-001] Cadastro Completo de Documentos**:
  - Título/Nome do documento (obrigatório)
  - Categoria/Tipo (ex: Fiscal, Trabalhista, Licença, Contrato, Seguros, Frota) - *Campo obrigatório*
  - Entidade/Órgão Emissor (ex: Receita Federal, Prefeitura, Bombeiros, Banco X)
  - Data de Emissão e Data de Vencimento *(Campos obrigatórios)*
  - Antecedência do Alerta (dias customizáveis por documento, ex: 60, 30, 15 ou 7 dias)
  - Responsável pelo Documento (nome e e-mail - *exibição condicional conforme configuração da empresa*)
  - Arquivo Anexo (PDF, PNG, JPG - **Limite máximo de 10 MB por arquivo**)
  - Observações e Instruções para Renovação
- **[RF-002] Categorias e Tags Personalizadas**: Capacidade de criar e editar categorias e tags dinâmicas.
- **[RF-003] Histórico de Renovações e Versões**: Ao renovar um documento, a nova versão assume o status vigente e a versão anterior fica mantida no histórico auditável.
- **[RF-010] Exclusão Permanente de Documentos**: Permitir que administradores excluam permanentemente cadastros realizados por engano (Hard Delete).
- **[RF-011] Arquivamento de Documentos (Soft Delete)**: Opção de arquivar documentos para oculta-los da listagem principal sem deletar o arquivo. Documentos arquivados são visíveis **exclusivamente para Administradores**.

### 4.2 Módulo de Visualização, Dashboard e Integrações
- **[RF-004] Painel Visual por Matriz de Cores**:
  - 🔴 **Vencido**: Data de vencimento ultrapassada.
  - 🟡 **Alerta Crítico**: Vencimento próximo (dentro do prazo de antecedência configurado).
  - 🔵 **Em Renovação**: Sinalizador indicando que a renovação já foi protocolada/solicitada.
  - 🟢 **Regular / Em Dia**: Vencimento distante e regular.
  - ⚪ **Indeterminado / Sem Vencimento**: Documentos de validade permanente (ex: Contrato Social).
- **[RF-005] Visão de Calendário e Sincronização Google Agenda**:
  - Exibição de calendário mensal/semanal destacando vencimentos.
  - **Sincronização com Google Agenda**: Ao cadastrar um documento, criar automaticamente um evento na Google Agenda do Administrador.
  - Botão de sincronização manual/periódica no componente de calendário.
- **[RF-006] Busca Avançada e Filtros**: Filtrar por palavra-chave, categoria, responsável, faixa de data de vencimento, status visual e opção de incluir arquivados (apenas para Admin).

### 4.3 Módulo de Notificações e Configuração por Empresa
- **[RF-007] Notificações Programadas por E-mail**: Disparo automático de e-mails de alerta com base na regra de notificação ativa da empresa.
- **[RF-008] Digest Semanal/Diário**: E-mail consolidado com resumo dos documentos que exigem ação na semana.
- **[RF-012] Configuração de Notificação por Empresa**: Chave seletora global por empresa:
  - **Modo "Notificar Todos os Administradores" (Ativo)**: Todos os administradores recebem e-mails de vencimento. O campo "Responsável" fica **oculto** na tela de cadastro do documento.
  - **Modo "Notificar Apenas Responsável" (Inativo)**: O campo "Responsável pelo documento" é **exibido** no cadastro e somente este e-mail recebe os alertas.

### 4.4 Módulo de Auditoria e Relatórios
- **[RF-009] Exportação de Relatórios**: Exportar listagens em PDF e Excel (XLSX).
- **[RF-013] Sistema de Auditoria e Histórico de Alterações (Audit Log)**:
  - Ao visualizar o documento, disponibilizar uma aba/painel de Auditoria.
  - Registrar quem visualizou/editou, data/hora exata e o **histórico detalhado de quais alterações foram feitas** (valor anterior vs novo valor).

---

## 5. Requisitos Não-Funcionais (RNF)

- **[RNF-001] Usabilidade e Interface (UI/UX)**: Interface limpa, responsiva (adaptada a Desktop, Tablet e Mobile), moderna e com alto apelo visual para fácil interpretação.
- **[RNF-002] Desempenho**: Tempo de carregamento do Dashboard e resposta de pesquisas em menos de 2 segundos.
- **[RNF-003] Segurança e Acesso**: Autenticação com senhas fortes, controle de acesso baseado em papéis (RBAC de 2 níveis: Admin e Operacional) e armazenamento seguro de arquivos anexos.
- **[RNF-004] Confiabilidade**: Tolerância a falhas na esteira de notificações (mecanismo de re-tentativa caso e-mail falhe).
- **[RNF-005] Auditabilidade e Rastreabilidade**: Registros de log de alteração imutáveis e protegidos contra manipulação.

---

## 6. Regras de Negócio (RN)

- **[RN-001] Troca Automática de Status**: O status visual do documento deve ser recalculado automaticamente a cada mudança de dia à meia-noite.
- **[RN-002] Imutabilidade do Histórico de Renovações**: Documentos substituídos por uma nova renovação não podem ser excluídos, apenas arquivados no histórico de versões.
- **[RN-003] Alerta Obrigatório**: Todo documento com data de vencimento preenchida gera alertas para o destinatário configurado.
- **[RN-004] Condicional de Responsável x Configuração da Empresa**:
  - Se a empresa estiver configurada para "Notificar todos os Administradores", o campo de Responsável é omitido no formulário de cadastro.
  - Se estiver configurada para "Notificar apenas o Responsável", o preenchimento do e-mail do Responsável é obrigatório no cadastro.
- **[RN-005] Escopo Único de Empresa (Single-Tenant no MVP)**: O MVP atenderá a uma única estrutura organizacional/empresa (suporte a múltiplas empresas/filiais post-MVP).
- **[RN-006] Visibilidade Restrita de Arquivados**: Documentos em status "Arquivado" (Soft Delete) são ocultados para usuários Operacionais e exibidos apenas para perfil Administrador.
- **[RN-007] Eventos em Tempo Real no Google Agenda**: A criação ou alteração de data de vencimento de um documento agenda/atualiza automaticamente o evento no Google Agenda do administrador.
- **[RN-008] Registro Obrigatório de Audit Log**: Qualquer alteração em campos de um documento deve registrar o ID do usuário, data/hora e o diff de valores alterados.

---

## 7. Escopo do MVP (Produto Mínimo Viável)

Para garantir uma entrega rápida e funcional, o MVP contemplará:
1. **Perfis de Acesso (2 níveis)**: Administrador e Operacional.
2. **Cadastro Completo com Data de Vencimento e Anexo** (PDF/PNG/JPG até 10MB).
3. **Dashboard Visual com Cores de Status** (🔴 Vencido, 🟡 Crítico, 🔵 Em Renovação, 🟢 Em dia).
4. **Configuração de Notificação por Empresa** (Notificar Administradores vs Notificar Responsável).
5. **Integração e Sincronização com Google Agenda** (RF-005).
6. **Sistema de Auditoria e Logs de Alterações** (RF-013).
7. **Opções de Arquivamento (Soft Delete para Admin) e Exclusão Permanente (Hard Delete)**.

*Recursos futuros post-MVP*: Suporte a múltiplas empresas/filiais (Multi-tenant), Notificações via WhatsApp, OCR para leitura automática de PDF e integração via API com órgãos emissores.

---

## 8. Definições Consolidadas com os Stakeholders (Fase 1 - Concluída)

| Questão / Aspecto | Decisão Consolidada | Impacto no Sistema |
| :--- | :--- | :--- |
| **1. Tipos de Documentos** | Suporte genérico a **qualquer tipo de documento** (Contratos, Certidões, Licenças, Apólices, etc.). | Campo "Tipo / Categoria" obrigatório no cadastro. |
| **2. Canal de Notificação** | **Exclusivamente E-mail** para a versão MVP. | Foco na entregabilidade de e-mails automáticos. WhatsApp post-MVP. |
| **3. Restrição por Setor** | **Sem restrição por setor no MVP**. | Todos os usuários cadastrados têm acesso ao repositório geral. |
| **4. Histórico de Renovações** | **Sim, histórico mantido**. | Arquivamento automático da versão antiga ao registrar nova renovação. |
| **5. Limite de Upload** | **10 MB por arquivo** (PDF, PNG, JPG). | Validação no frontend e backend durante o upload. |
| **6. Estrutura de Empresa** | **Empresa Única no MVP**. | Modelo simples Single-Tenant no MVP (Multi-empresa post-MVP). |
| **7. Perfis de Acesso** | **Apenas 2 níveis**: Administrador e Operacional. | Removido o perfil Leitor/Auditor. Simplificação de matriz de permissões. |
| **8. Arquivamento (Soft Delete)** | **Opção de arquivar documentos**. | Documentos arquivados ficam ocultos na visão geral e acessíveis **somente por Administradores**. |
| **9. Data de Vencimento** | **Campo obrigatório no cadastro**. | Base para cálculo de status visual, alertas por e-mail e Google Agenda. |
| **10. Regra de Notificação** | **Configuração global por Empresa**. | Permite alternar entre "Notificar todos os Admins" (oculta campo Responsável) ou "Notificar Responsável" (exibe campo Responsável). |
| **11. Google Agenda** | **Integração automática no RF-005**. | Ao cadastrar/alterar vencimento, gera evento na Google Agenda do Admin e permite sincronização na tela de calendário. |
| **12. Trilha de Auditoria** | **Sistema de Audit Log detalhado**. | Exibe quem editou, quando editou e o histórico exato de campos alterados (de/para). |
| **13. Exclusão permanente** | **Hard Delete disponível para Admins**. | Administradores podem excluir permanentemente cadastros inseridos por engano. |

---

## 9. Próximos Passos
Com as definições de negócios e especificações operacionais concluídas e atualizadas, a **Fase 1 (Análise e Levantamento de Requisitos)** está 100% consolidada no PRD.
Aguardando autorização para iniciar a **Fase 2: Design e Arquitetura do Sistema** (Definição da stack tecnológica, modelagem de banco de dados e prototipagem de telas/fluxos).
