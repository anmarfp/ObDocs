# Procedures

## Ciclo de desenvolvimento e acompanhamento de etapa

O projeto segue as seis etapas abaixo, em ordem. A seção **Etapa atual do ciclo de desenvolvimento** em `memory/project/project.md` deve sempre registrar a etapa, o status e a próxima transição. A atualização desse registro é obrigatória sempre que uma etapa for iniciada ou concluída.

### 1.1 — Análise e Levantamento de Requisitos (Fase de Definição)

Antes de escrever código, compreender o problema a ser resolvido por meio de entrevistas com stakeholders e potenciais usuários. Mapear requisitos funcionais (o que o sistema deve fazer) e não funcionais, incluindo segurança, tempo de resposta e escalabilidade. Definir o escopo do MVP (Produto Mínimo Viável).

### 2.2 — Design e Arquitetura do Sistema (Fase de Planejamento Técnico)

Determinar como o software será construído estrutural e visualmente:

- definir a arquitetura de software, incluindo stack tecnológica, linguagens, frameworks, banco de dados e APIs;
- modelar os dados, o esquema de banco de dados e seus relacionamentos;
- elaborar UX/UI: protótipos de telas, fluxos de navegação e guia de estilo.

### 3.3 — Implementação e Codificação (Fase de Construção)

Construir o produto em ciclos curtos (sprints), usando uma abordagem ágil como Scrum ou Kanban. Implementar backend (regras de negócio, autenticação e integração com banco de dados) e frontend (interface do usuário). Controlar versões com Git e realizar revisões de código.

### 4.4 — Testes e Garantia de Qualidade — QA (Fase de Validação)

Identificar e corrigir falhas antes do envio ao usuário final. Executar testes automatizados unitários, de integração e ponta a ponta (E2E); testes de usabilidade e aceitação (UAT); e testes de carga e segurança para verificar vulnerabilidades e resistência sob alto tráfego.

### 5.5 — Implantação e Publicação (Fase de Lançamento)

Disponibilizar o software em produção. Configurar a infraestrutura de hospedagem (nuvem ou servidores dedicados), automatizar a esteira de integração e entrega contínua (CI/CD) e publicar em servidores web ou lojas de aplicativos, conforme a plataforma.

### 6.6 — Manutenção e Evolução (Fase Continuada)

Monitorar estabilidade, logs e erros em tempo real; aplicar correções operacionais e patches de segurança; e analisar métricas de uso para priorizar novas funcionalidades. O ciclo continua após a primeira entrega.

- **source:** definição do stakeholder em 2026-08-02.

## Development closeout

1. Run affected checks.
2. Run broader repository checks required by the Definition of Done.
3. Record commands, exit codes, and degraded checks.
4. Review the diff and update durable memory only when warranted.

## Operational procedures

- **Git Versioning & Synchronization:**
  - `git commit -am "<mensagem>"`
  - `git push origin main`
- **Aihaus Memory Discovery:**
  - `node .aihaus/tools/refresh.mjs --repo . --json`
  - `node .aihaus/tools/refresh.mjs --repo . --status --json`
