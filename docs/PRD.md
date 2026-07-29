# PRD - Documento de Requisitos do Produto
## Sistema de Gestão e Acompanhamento de Vencimento de Documentos (DocsOb)

| Informação | Detalhe |
| :--- | :--- |
| **Projeto** | DocsOb - Gestão de Vencimento de Documentos |
| **Fase Atual** | Fase 1: Análise e Levantamento de Requisitos |
| **Status** | Em Elaboração / Validação |
| **Versão** | 0.1.0 |
| **Última Atualização** | 2026-07-29 |

---

## 1. Visão Geral e Problema

### 1.1 Contexto e Problema
Na administração diária de empresas, o acompanhamento manual de datas de vencimento de documentos (como certidões negativas, licenças de operação, contratos de fornecedores, obrigações trabalhistas, apólices de seguro, licenças sanitárias/ambientais, entre outros) através de planilhas desatualizadas ou e-mails causa retrabalho e riscos operacionais graves. A perda de prazos resulta em multas, suspensão de alvarás, bloqueios contratuais e impedimento de participação em licitações.

### 1.2 Solução Proposta
Desenvolver um aplicativo web/mobile intuitivo, focado na visualização rápida e proativa do status de vencimento dos documentos da empresa, com sistema visual por cores, alertas automáticos multicanal e gestão de renovações.

---

## 2. Objetivos e Métricas de Sucesso

- **Zero Vencimentos Não Detectados**: Garantir que 100% dos documentos cadastrados gerem alertas prévios.
- **Redução de Tempo de Consulta**: Permitir que qualquer documento ou certidão seja localizado em menos de 5 segundos.
- **Visibilidade Executiva**: Oferecer aos gestores um Dashboard em tempo real sobre a saúde documental da empresa.

---

## 3. Personas e Perfis de Usuários

| Perfil | Descrição | Permissões / Necessidades |
| :--- | :--- | :--- |
| **Administrador / Gestor** | Diretores e gerentes administrativos. | Acesso total ao sistema, relatórios, configurações globais, gestão de usuários e visão consolidada do Dashboard. |
| **Operacional / Analista** | Assistentes e analistas administrativos. | Cadastro de documentos, upload de anexos, atualização de datas, inclusão de comprovantes de renovação. |
| **Leitor / Auditor** | Auditores internos/externos ou consultores. | Acesso somente leitura para busca, consulta e download de comprovantes e documentos válidos. |

---

## 4. Requisitos Funcionais (RF)

### 4.1 Módulo de Cadastro e Armazenamento
- **[RF-001] Cadastro Completo de Documentos**:
  - Título/Nome do documento (obrigatório)
  - Categoria/Tipo (ex: Fiscal, Trabalhista, Licença, Contrato, Seguros, Frota) - *Campo obrigatório*
  - Entidade/Órgão Emissor (ex: Receita Federal, Prefeitura, Bombeiros, Banco X)
  - Data de Emissão e Data de Vencimento
  - Antecedência do Alerta (dias customizáveis por documento, ex: 60, 30, 15 ou 7 dias)
  - Responsável pelo Documento (nome e e-mail para recebimento dos alertas)
  - Arquivo Anexo (PDF, PNG, JPG - **Limite máximo de 10 MB por arquivo**)
  - Observações e Instruções para Renovação
- **[RF-002] Categorias e Tags Personalizadas**: Capacidade de criar e editar categorias e tags dinâmicas.
- **[RF-003] Histórico de Renovações e Versões**: Ao renovar um documento, a nova versão assume o status vigente e a versão anterior fica mantida no histórico auditável.
- **[RF-010] Exclusão Permanente de Documentos**: Permitir que administradores excluam permanentemente cadastros realizados por engano (Hard Delete).

### 4.2 Módulo de Visualização e Dashboard
- **[RF-004] Painel Visual por Matriz de Cores**:
  - 🔴 **Vencido**: Data de vencimento ultrapassada.
  - 🟡 **Alerta Crítico**: Vencimento próximo (dentro do prazo de antecedência configurado).
  - 🔵 **Em Renovação**: Sinalizador indicando que a renovação já foi protocolada/solicitada.
  - 🟢 **Regular / Em Dia**: Vencimento distante e regular.
  - ⚪ **Indeterminado / Sem Vencimento**: Documentos de validade permanente (ex: Contrato Social).
- **[RF-005] Visão de Calendário**: Calendário mensal/semanal destacando os vencimentos programados por dia.
- **[RF-006] Busca Avançada e Filtros**: Filtrar por palavra-chave, categoria, responsável, faixa de data de vencimento e status visual.

### 4.3 Módulo de Notificações e Alertas
- **[RF-007] Notificações Programadas por E-mail**: Disparo automático de e-mails para o e-mail do **Responsável pelo documento**, respeitando a antecedência de alerta configurada no cadastro.
- **[RF-008] Digest Semanal/Diário**: E-mail consolidado com resumo dos documentos que exigem ação na semana para a equipe administrativa.

### 4.4 Módulo de Exportação e Relatórios
- **[RF-009] Exportação de Relatórios**: Permitir exportar listagens de documentos vencidos ou a vencer em PDF e Excel (XLSX).

---

## 5. Requisitos Não-Funcionais (RNF)

- **[RNF-001] Usabilidade e Interface (UI/UX)**: Interface limpa, responsiva (adaptada a Desktop, Tablet e Mobile), moderna e com alto apelo visual para fácil interpretação.
- **[RNF-002] Desempenho**: Tempo de carregamento do Dashboard e resposta de pesquisas em menos de 2 segundos.
- **[RNF-003] Segurança e Acesso**: Autenticação com senhas fortes, controle de acesso baseado em papéis (RBAC) e armazenamento seguro de arquivos anexos.
- **[RNF-004] Confiabilidade**: Tolerância a falhas na esteira de notificações (mecanismo de re-tentativa caso e-mail falhe).

---

## 6. Regras de Negócio (RN)

- **[RN-001] Troca Automática de Status**: O status visual do documento deve ser recalculado automaticamente a cada mudança de dia à meia-noite.
- **[RN-002] Imutabilidade do Histórico de Renovações**: Documentos substituídos por uma nova renovação não podem ser excluídos, apenas arquivados no histórico.
- **[RN-003] Alerta Obrigatório**: Todo documento com data de vencimento preenchida obrigatoriamente vincula o e-mail do responsável para envio dos alertas.
- **[RN-004] Destinatário do Alerta**: O e-mail de notificação de vencimento é enviado diretamente para o e-mail do usuário/responsável cadastrado no documento.
- **[RN-005] Escopo Único de Empresa (Single-Tenant no MVP)**: O MVP atenderá a uma única estrutura organizacional/empresa (suporte a múltiplas empresas/filiais post-MVP).

---

## 7. Escopo do MVP (Produto Mínimo Viável)

Para garantir uma entrega rápida e funcional, o MVP contemplará:
1. **Cadastro e Upload de Documentos** (PDF/PNG/JPG até 10MB) com vinculo de Tipo/Categoria.
2. **Dashboard Visual com Cores de Status** (🔴 Vencido, 🟡 Crítico, 🔵 Em Renovação, 🟢 Em dia).
3. **Antecedência de Alerta Customizável por Documento**.
4. **Notificações Automáticas por E-mail** enviadas para o Responsável.
5. **Histórico de Renovações e Exclusão Permanente (Hard Delete)**.
6. **Autenticação Básica com Perfis de Usuário** sem restrição por departamento no MVP.

*Recursos futuros post-MVP*: Suporte a múltiplas empresas/filiais (Multi-tenant), Notificações via WhatsApp, OCR para leitura automática de PDF e integração via API com órgãos emissores.

---

## 8. Definições Consolidadas com os Stakeholders (Fase 1 - Concluída)

| Questão / Aspecto | Decisão Consolidada | Impacto no Sistema |
| :--- | :--- | :--- |
| **1. Tipos de Documentos** | Suporte genérico a **qualquer tipo de documento** (Contratos, Certidões, Licenças, Apólices, etc.). | Campo "Tipo / Categoria" obrigatório no cadastro. |
| **2. Canal de Notificação** | **Exclusivamente E-mail** para a versão MVP. | Foco na entregabilidade de e-mails automáticos. WhatsApp post-MVP. |
| **3. Restrição por Setor** | **Sem restrição por setor no MVP**. | Todos os usuários cadastrados têm acesso ao repositório geral. |
| **4. Histórico de Renovações** | **Sim, histórico mantido**. | Arquivamento automático da versão antiga ao registrar nova renovação. |
| **5. Destinatário dos Alertas** | **E-mail do Responsável pelo documento** (Opção A). | Alertas direcionados para a pessoa focada naquele documento. |
| **6. Status "Em Renovação"** | **Sim, status 🔵 Em Renovação adicionado**. | Permite indicar protocolo em andamento e evitar cobranças duplicadas. |
| **7. Antecedência de Alertas** | **Customizada por documento**. | Cada documento pode ter sua própria janela de dias para aviso prévio. |
| **8. Limite de Upload** | **10 MB por arquivo** (PDF, PNG, JPG). | Validação no frontend e backend durante o upload. |
| **9. Estrutura de Empresa** | **Empresa Única no MVP**. | Modelo simples Single-Tenant no MVP (Multi-empresa post-MVP). |
| **10. Exclusão de Cadastros** | **Exclusão permanente (Hard Delete)**. | Administradores podem excluir permanentemente erros de digitação/cadastro. |

---

## 9. Próximos Passos
Com as definições de negócios e especificações operacionais concluídas, a **Fase 1 (Análise e Levantamento de Requisitos)** está 100% consolidada no PRD.
Aguardando autorização para iniciar a **Fase 2: Design e Arquitetura do Sistema** (Definição da stack tecnológica, modelagem de banco de dados e prototipagem de telas/fluxos).
