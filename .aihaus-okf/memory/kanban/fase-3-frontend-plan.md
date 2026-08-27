# 📋 Plano Arquitetural da Fase 3: Dashboard, Agenda, Auditoria, Usuários & Configurações (DocsOb Frontend)

**Projeto:** DocsOb — Gestão de Vencimento de Documentos  
**Agente Responsável:** Planner (`plan-orchestrator`)  
**Status:** Pronto para Execução / Aprovado para Implementação  
**Data:** 27/08/2026  
**Stack Frontend:** React 18/19, TypeScript, Vite, Tailwind CSS (Midnight Navy Theme), Axios, AuthContext, Lucide React, Zod, React Hook Form, Recharts / Chart.js  
**Backend Vinculado:** Express + TypeScript + Prisma ORM + PostgreSQL (100% testado e integrado)  

---

## 📑 Sumário Executivo

A **Fase 3** conclui o ecossistema frontend do DocsOb, entregando os módulos estratégicos, administrativos e de integração do sistema:

1. **Dashboard Executivo & Relatórios:** Painel gerencial em tempo real com KPIs consolidados (Total Ativos, Vencidos, Críticos, Em Renovação, Taxa de Conformidade %), gráficos de distribuição por status e categoria, tabela de vencimentos próximos e exportador de relatórios tabulares (CSV/JSON) com controle RBAC.
2. **Calendário & Google Sync (RF-005):** Grade visual interativa (mês/ano) destacando vencimentos coloridos conforme a Matriz de Status, disparo de sincronização manual com a API do Google Agenda e modal de inspeção de logs de sincronização (`gcal_sync_logs` restrito a `ADMIN`).
3. **Trilha de Auditoria Completa (RF-013 - RBAC Admin):** Visualizador enterprise de logs com filtros combinados (usuário, ação, intervalo de datas, busca textual) e modal comparativo visual de alterações (*Diff Viewer: old vs new*).
4. **Gestão de Usuários & Controle de Acesso (RF-014 - RBAC Admin):** Módulo de administração de contas (criação, edição, ativação/inativação de acessos e redefinição de senhas com hashing seguro).
5. **Configurações Globais da Empresa (RN-004 - RBAC Admin):** Painel de parametrização do modo de notificação (`ALL_ADMINS` vs `ONLY_RESPONSIBLE`) com disparo sob demanda de recálculo de status e envio de digest/resumo periódico.
6. **Central de Notificações no Top Header:** Dropdown flutuante com badge em tempo real de documentos críticos/vencidos e ações rápidas.

---

## 1. 🏗️ Arquitetura de Diretórios e Componentes (`frontend/src/`)

```
frontend/src/
├── components/
│   ├── charts/
│   │   ├── StatusPieChart.tsx             # Gráfico de rosca/pizza com distribuição por status
│   │   └── CategoryBarChart.tsx           # Gráfico de barras horizontais por categoria
│   ├── guards/
│   │   ├── ProtectedRoute.tsx             # Guarda de rota autenticada
│   │   └── AdminRoute.tsx                 # Guarda de rota exclusiva para Administradores
│   └── layout/
│       ├── Header.tsx                     # Top Header com busca, sino de notificações e avatar
│       ├── Sidebar.tsx                    # Sidebar com navegação e seção de Administração protegida por RBAC
│       └── NotificationsDropdown.tsx      # Dropdown com mini feed de documentos pendentes e links
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── MetricCardsGrid.tsx        # Grid de cards com KPIs (Total Ativos, Vencidos, Críticos, Em Dia)
│   │   │   ├── MetricCard.tsx             # Card individual de KPI com ícone, valor e variação
│   │   │   ├── ComplianceGauge.tsx        # Indicador visual de percentual de conformidade (%)
│   │   │   ├── UpcomingExpirationsList.tsx# Lista dos próximos documentos a vencer (janela de 30 dias)
│   │   │   ├── ExportReportModal.tsx      # Modal de exportação de relatórios com filtros e formato (CSV/JSON)
│   │   │   └── DashboardSkeleton.tsx      # Esqueleto de carregamento com shimmer effect
│   │   ├── hooks/
│   │   │   └── useDashboard.ts            # Hook para buscar métricas e gerenciar exportação
│   │   └── services/
│   │       └── dashboardService.ts        # Chamadas para /api/v1/dashboard/metrics e /api/v1/reports/*
│   ├── calendar/
│   │   ├── components/
│   │   │   ├── CalendarHeader.tsx         # Navegação entre meses, seletor de ano e botão de sincronização
│   │   │   ├── CalendarGrid.tsx           # Grade de 7 colunas (Dom-Sáb) com células dos dias
│   │   │   ├── CalendarDayCell.tsx        # Célula individual com badges de eventos e indicador de hoje
│   │   │   ├── CalendarEventBadge.tsx     # Pill compacta do evento com cor da categoria/status
│   │   │   ├── CalendarEventModal.tsx     # Modal com detalhes rápidos do documento clicado no calendário
│   │   │   ├── GoogleSyncBanner.tsx       # Banner de status da sincronização com Google Agenda
│   │   │   └── SyncLogsModal.tsx          # Modal com tabela de histórico de logs de sincronização (Admin)
│   │   ├── hooks/
│   │   │   └── useCalendar.ts             # Hook para listagem de eventos por mês/ano e trigger de sync
│   │   └── services/
│   │       └── calendarService.ts         # Chamadas para /api/v1/calendar/*
│   ├── audit/
│   │   ├── components/
│   │   │   ├── AuditFiltersBar.tsx        # Filtros por ação (CREATE, UPDATE, etc.), usuário e datas
│   │   │   ├── AuditTable.tsx             # Tabela com listagem cronológica de logs de auditoria
│   │   │   ├── AuditTableRow.tsx          # Linha com badge de ação, autor, documento e botão de diff
│   │   │   ├── AuditDiffModal.tsx         # Modal com visualização JSON comparativa (old vs new)
│   │   │   └── AuditSkeleton.tsx          # Shimmer loading para tabela de auditoria
│   │   ├── hooks/
│   │   │   └── useAuditLogs.ts            # Hook de paginação, filtros e busca de logs
│   │   └── services/
│   │       └── auditService.ts            # Chamadas para /api/v1/audit/*
│   ├── users/
│   │   ├── components/
│   │   │   ├── UserTable.tsx              # Tabela de gestão de usuários do sistema
│   │   │   ├── UserTableRow.tsx           # Linha com avatar, nome, e-mail, role badge, status e ações
│   │   │   ├── UserFormModal.tsx          # Modal de criação e edição de usuário (nome, e-mail, role, senha)
│   │   │   ├── UserResetPasswordModal.tsx # Modal para administrador redefinir senha de um usuário
│   │   │   ├── UserStatusBadge.tsx        # Badge visual indicando status Ativo (verde) ou Inativo (cinza)
│   │   │   └── UserStatusToggleDialog.tsx # Confirmação de ativação/inativação de acesso
│   │   ├── hooks/
│   │   │   └── useUsers.ts                # Hook de listagem e mutações de usuários
│   │   └── services/
│   │       └── userService.ts             # Chamadas para /api/v1/users/*
│   └── settings/
│       ├── components/
│       │   ├── NotificationModeCard.tsx   # Card interativo de seleção de regra RN-004 com switch visual
│       │   ├── SystemActionsCard.tsx      # Ações manuais de administração (Recalcular Status, Disparar Digest)
│       │   └── SystemConfigSkeleton.tsx   # Shimmer loading para tela de configurações
│       ├── hooks/
│       │   └── useCompanyConfig.ts        # Hook para consulta e atualização de configurações
│       └── services/
│           ├── companyService.ts          # Chamadas para /api/v1/company/config
│           └── notificationService.ts     # Chamadas para /api/v1/notifications/*
├── pages/
│   ├── DashboardPage.tsx                  # Página inicial (/ ou /dashboard)
│   ├── CalendarioPage.tsx                 # Página do Calendário e Google Sync (/calendario)
│   ├── AuditoriaPage.tsx                  # Página da Trilha de Auditoria (/auditoria - Admin Only)
│   ├── UsuariosPage.tsx                   # Página de Gestão de Usuários (/usuarios - Admin Only)
│   └── ConfiguracoesPage.tsx              # Página de Configurações da Empresa (/configuracoes - Admin Only)
└── types/
    ├── dashboard.types.ts                 # Tipos e DTOs do Dashboard e Relatórios
    ├── calendar.types.ts                  # Tipos e DTOs de Eventos e Google Sync Logs
    ├── audit.types.ts                     # Tipos e DTOs de Trilha de Auditoria
    ├── user.types.ts                      # Tipos e DTOs de Gestão de Usuários
    └── settings.types.ts                  # Tipos e DTOs de Configuração da Empresa
```

---

## 2. 📝 Contratos TypeScript e Interfaces de Dados

### 2.1 Tipos do Dashboard e Relatórios (`types/dashboard.types.ts`)

```typescript
import { DocumentStatus } from './document.types';

export interface CategoryMetric {
  categoryId: string;
  categoryName: string;
  colorHex: string | null;
  count: number;
}

export interface UpcomingExpirationDoc {
  id: string;
  title: string;
  expirationDate: string;
  status: DocumentStatus;
  category: {
    id: string;
    name: string;
    colorHex?: string | null;
  };
  responsibleName?: string | null;
}

export interface DashboardMetrics {
  statusCounts: Record<DocumentStatus, number>;
  totalActive: number;
  totalArchived: number;
  complianceRate: number;
  byCategory: CategoryMetric[];
  upcomingExpirations: UpcomingExpirationDoc[];
}

export interface ExecutiveSummaryReport {
  totalDocuments: number;
  activeDocuments: number;
  archivedDocuments: number;
  expiredCount: number;
  criticalCount: number;
  renewalCount: number;
  regularCount: number;
  indeterminateCount: number;
  compliancePercentage: number;
  generatedAt: string;
}

export interface ReportQueryParams {
  format?: 'csv' | 'json';
  status?: DocumentStatus;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
}
```

### 2.2 Tipos do Calendário e Google Sync (`types/calendar.types.ts`)

```typescript
import { DocumentStatus } from './document.types';

export interface CalendarEvent {
  id: string;
  title: string;
  expirationDate: string;
  status: DocumentStatus;
  category: {
    id: string;
    name: string;
    colorHex?: string | null;
    description?: string | null;
  } | null;
  colorHex: string;
}

export interface CalendarEventsResponse {
  events: CalendarEvent[];
}

export interface GCalSyncResponse {
  totalActive: number;
  synced: number;
  errors: number;
  message: string;
}

export interface GCalSyncLogItem {
  id: string;
  documentId: string;
  gcalEventId: string | null;
  status: 'SYNCED' | 'ERROR';
  lastSyncedAt: string;
  errorMessage: string | null;
  document: {
    id: string;
    title: string;
  };
}

export interface GCalSyncLogsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  logs: GCalSyncLogItem[];
}
```

### 2.3 Tipos da Trilha de Auditoria (`types/audit.types.ts`)

```typescript
import { AuditAction, UserRole } from './document.types';

export interface AuditLogItem {
  id: string;
  documentId: string | null;
  userId: string | null;
  userName: string;
  action: AuditAction;
  diffData: Record<string, { old: unknown; new: unknown }>;
  timestamp: string;
  document?: {
    id: string;
    title: string;
    isArchived: boolean;
  } | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface AuditLogsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  logs: AuditLogItem[];
}

export interface AuditLogDetailResponse {
  log: AuditLogItem;
}

export interface AuditFilterParams {
  page?: number;
  limit?: number;
  documentId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  search?: string;
}
```

### 2.4 Tipos de Gestão de Usuários (`types/user.types.ts`)

```typescript
import { UserRole } from './document.types';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserListResponse {
  users: UserItem[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
}

export interface ResetPasswordInput {
  password: string;
}

export interface UserMutationResponse {
  message: string;
  user?: UserItem;
}
```

### 2.5 Tipos de Configurações da Empresa (`types/settings.types.ts`)

```typescript
export enum NotificationMode {
  ALL_ADMINS = 'ALL_ADMINS',           // Notifica todos os administradores (campo responsável oculto no cadastro)
  ONLY_RESPONSIBLE = 'ONLY_RESPONSIBLE', // Notifica apenas o responsável (campo obrigatório no cadastro)
}

export interface CompanyConfig {
  id: string;
  notificationMode: NotificationMode;
  updatedAt: string;
  updatedById?: string | null;
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CompanyConfigResponse {
  config: CompanyConfig;
}

export interface UpdateCompanyConfigInput {
  notificationMode: NotificationMode;
}

export interface SystemRecalculateResponse {
  message: string;
  totalUpdated: number;
  statusChanges?: Array<{
    documentId: string;
    oldStatus: string;
    newStatus: string;
  }>;
}

export interface SystemDigestResponse {
  message: string;
  recipientsCount: number;
  itemsIncluded: number;
}
```

---

## 3. ⚙️ Camada de Serviços Axios Integrada

### 3.1 `dashboardService.ts`
```typescript
import api from '@/services/api';
import { DashboardMetrics, ExecutiveSummaryReport, ReportQueryParams } from '../types/dashboard.types';

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const { data } = await api.get<DashboardMetrics>('/api/v1/dashboard/metrics');
    return data;
  },

  async getExecutiveSummary(params?: ReportQueryParams): Promise<ExecutiveSummaryReport> {
    const { data } = await api.get<ExecutiveSummaryReport>('/api/v1/reports/summary', { params });
    return data;
  },

  async exportReport(params: ReportQueryParams): Promise<Blob | { documents: any[]; total: number }> {
    if (params.format === 'json') {
      const { data } = await api.get('/api/v1/reports/export', { params });
      return data;
    }
    const response = await api.get('/api/v1/reports/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return response.data;
  },
};
```

### 3.2 `calendarService.ts`
```typescript
import api from '@/services/api';
import { CalendarEvent, CalendarEventsResponse, GCalSyncResponse, GCalSyncLogsResponse } from '../types/calendar.types';

export const calendarService = {
  async getEvents(month?: number, year?: number): Promise<CalendarEvent[]> {
    const { data } = await api.get<CalendarEventsResponse>('/api/v1/calendar/events', {
      params: { month, year },
    });
    return data.events;
  },

  async triggerManualSync(): Promise<GCalSyncResponse> {
    const { data } = await api.post<GCalSyncResponse>('/api/v1/calendar/sync');
    return data;
  },

  async getSyncLogs(page = 1, limit = 20): Promise<GCalSyncLogsResponse> {
    const { data } = await api.get<GCalSyncLogsResponse>('/api/v1/calendar/sync-logs', {
      params: { page, limit },
    });
    return data;
  },
};
```

### 3.3 `auditService.ts`
```typescript
import api from '@/services/api';
import { AuditLogItem, AuditLogsResponse, AuditLogDetailResponse, AuditFilterParams } from '../types/audit.types';

export const auditService = {
  async getLogs(params: AuditFilterParams = {}): Promise<AuditLogsResponse> {
    const { data } = await api.get<AuditLogsResponse>('/api/v1/audit', { params });
    return data;
  },

  async getLogById(id: string): Promise<AuditLogItem> {
    const { data } = await api.get<AuditLogDetailResponse>(`/api/v1/audit/${id}`);
    return data.log;
  },
};
```

### 3.4 `userService.ts`
```typescript
import api from '@/services/api';
import { UserItem, UserListResponse, CreateUserInput, UpdateUserInput, ResetPasswordInput, UserMutationResponse } from '../types/user.types';

export const userService = {
  async listUsers(): Promise<UserItem[]> {
    const { data } = await api.get<UserListResponse>('/api/v1/users');
    return data.users;
  },

  async createUser(input: CreateUserInput): Promise<UserMutationResponse> {
    const { data } = await api.post<UserMutationResponse>('/api/v1/users', input);
    return data;
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<UserMutationResponse> {
    const { data } = await api.put<UserMutationResponse>(`/api/v1/users/${id}`, input);
    return data;
  },

  async toggleStatus(id: string): Promise<UserMutationResponse> {
    const { data } = await api.patch<UserMutationResponse>(`/api/v1/users/${id}/status`);
    return data;
  },

  async resetPassword(id: string, input: ResetPasswordInput): Promise<UserMutationResponse> {
    const { data } = await api.patch<UserMutationResponse>(`/api/v1/users/${id}/password`, input);
    return data;
  },
};
```

### 3.5 `companyService.ts` & `notificationService.ts`
```typescript
import api from '@/services/api';
import { CompanyConfig, CompanyConfigResponse, UpdateCompanyConfigInput, SystemRecalculateResponse, SystemDigestResponse } from '../types/settings.types';

export const companyService = {
  async getConfig(): Promise<CompanyConfig> {
    const { data } = await api.get<CompanyConfigResponse>('/api/v1/company/config');
    return data.config;
  },

  async updateConfig(input: UpdateCompanyConfigInput): Promise<{ message: string; config: CompanyConfig }> {
    const { data } = await api.put<{ message: string; config: CompanyConfig }>('/api/v1/company/config', input);
    return data;
  },
};

export const notificationService = {
  async recalculateStatuses(): Promise<SystemRecalculateResponse> {
    const { data } = await api.post<SystemRecalculateResponse>('/api/v1/notifications/recalculate');
    return data;
  },

  async triggerDigest(): Promise<SystemDigestResponse> {
    const { data } = await api.post<SystemDigestResponse>('/api/v1/notifications/digest');
    return data;
  },
};
```

---

## 4. 🛡️ Controle de Acesso Baseado em Papéis (RBAC Matrix - Fase 3)

| Módulo / Rota Frontend | Ação / Visualização | `ADMIN` | `OPERATIONAL` |
| :--- | :--- | :---: | :---: |
| **`/dashboard`** | Visualização de KPIs e Gráficos | ✅ Total | ✅ Parcial (Sem métricas de arquivados) |
| **`/dashboard`** | Exportar Relatório com Arquivados | ✅ Permitido | 🚫 Oculto / Bloqueado |
| **`/calendario`** | Visualizar Agenda de Vencimentos | ✅ Sim | ✅ Sim |
| **`/calendario`** | Disparar Sincronização Google Agenda | ✅ Sim | ✅ Sim |
| **`/calendario`** | Ver Logs de Sincronização Google | ✅ Sim | 🚫 Oculto / 403 |
| **`/auditoria`** | Acessar Trilha de Auditoria e Diffs | ✅ Sim | 🚫 Redireciona / 403 |
| **`/usuarios`** | Criar, Editar, Ativar e Redefinir Senha | ✅ Sim | 🚫 Redireciona / 403 |
| **`/configuracoes`**| Alterar Modo de Notificação RN-004 | ✅ Sim | 🚫 Redireciona / 403 |
| **`/configuracoes`**| Disparar Recálculo Manual / Digest | ✅ Sim | 🚫 Redireciona / 403 |

---

## 5. 🧪 Plano de Validação e Matriz de Testes para QA

```
+===================================================================================================================+
|                                        MATRIZ DE TESTES DE QA - FASE 3                                            |
+=========+=======================================+=========================================================+=======+
| ID      | Cenário de Teste                      | Critério de Sucesso Esperado                            | Tipo  |
+=========+=======================================+=========================================================+=======+
| TC-F3-01| Carregamento do Dashboard Executivo   | KPIs exibem números corretos e gráficos renderizam com  | E2E   |
|         | e Métricas de Conformidade            | as cores da Matriz (🔴🟡🔵🟢⚪) sem erros no console     |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-02| Exportação de Relatórios (CSV/JSON)   | Download de arquivo CSV com formato UTF-8 e colunas     | Int.  |
|         | com filtros de status e categoria     | corretas; formato JSON retorna estrutura padronizada    |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-03| Grade Mensal do Calendário            | Eventos são renderizados no dia correto com badges      | Comp. |
|         | e Navegação Entre Meses/Anos          | clicáveis que abrem modal com detalhes do documento     |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-04| Sincronização com Google Agenda       | Botão "Sincronizar" exibe spinner e retorna toast com   | E2E   |
|         | e Consulta de Logs de Sync            | quantidade de eventos criados/atualizados no Google     |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-05| Trilha de Auditoria (Admin Only)      | Filtros por usuário, ação e período funcionam com       | RBAC/ |
|         | com Comparador Diff (Old vs New)      | paginação; clique em registro exibe modal comparativo   | Int.  |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-06| Bloqueio RBAC na Trilha de Auditoria  | Usuário OPERATIONAL que tenta acessar /auditoria é      | RBAC  |
|         | para perfil OPERATIONAL               | bloqueado por guarda de rota e redirecionado com aviso  |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-07| Cadastro de Novo Usuário com Role     | Modal valida e-mail único, senha >= 6 caracteres e cria | Unit/ |
|         | (ADMIN / OPERATIONAL)                 | usuário com feedback toast imediato na tabela           | Int.  |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-08| Ativação / Inativação de Usuário      | Altera status visual; impede que o próprio administrador| Int.  |
|         | com Proteção de Auto-Inativação       | logado desative sua própria conta (400)                 |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-09| Redefinição de Senha de Usuário       | Modal solicita nova senha com validação e atualiza sem  | Int.  |
|         | pelo Administrador                    | expor senhas em texto puro na interface                 |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-10| Alteração da Regra de Notificação     | Switch altera entre ALL_ADMINS e ONLY_RESPONSIBLE;      | E2E   |
|         | Global da Empresa (RN-004)            | reflete imediatamente no formulário de novos documentos |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-11| Ações Manuais de Recálculo e Digest   | Botões disparam rotinas de background com feedback de   | Int.  |
|         | no Painel de Configurações            | quantidade de status recalculados e e-mails enviados    |       |
+---------+---------------------------------------+---------------------------------------------------------+-------+
| TC-F3-12| Dropdown de Notificações no Header    | Sino exibe contagem de pendências e mini feed com links | Comp. |
|         | com Ações Rápidas                     | clicáveis para detalhes dos documentos críticos         |       |
+=========+=======================================+=========================================================+=======+
```

---

## 6. 📅 Cronograma de Implementação e Tarefas Kanban

| ID Tarefa | Título da Tarefa | Responsável | Dependência | Status |
| :--- | :--- | :---: | :---: | :---: |
| `T-F3-01` | **Camada de Tipos e Serviços da Fase 3** (`types/*.ts`, `services/*.ts`) | Implementer | Fase 2 Concluída | `ready` |
| `T-F3-02` | **Dashboard Executivo, Métricas e Gráficos** (`DashboardPage.tsx`, Recharts) | Implementer | `T-F3-01` | `ready` |
| `T-F3-03` | **Modal de Exportação de Relatórios** (`ExportReportModal.tsx`, CSV/JSON) | Implementer | `T-F3-02` | `ready` |
| `T-F3-04` | **Calendário Visual e Eventos de Vencimento** (`CalendarioPage.tsx`, `CalendarGrid.tsx`) | Implementer | `T-F3-01` | `ready` |
| `T-F3-05` | **Integração Google Sync e Modal de Logs** (`GoogleSyncBanner.tsx`, `SyncLogsModal.tsx`) | Implementer | `T-F3-04` | `ready` |
| `T-F3-06` | **Trilha de Auditoria e Modal de Diff JSON** (`AuditoriaPage.tsx`, `AuditDiffModal.tsx`) | Implementer | `T-F3-01` | `ready` |
| `T-F3-07` | **Gestão de Usuários e Redefinição de Senha** (`UsuariosPage.tsx`, `UserFormModal.tsx`) | Implementer | `T-F3-01` | `ready` |
| `T-F3-08` | **Configurações da Empresa e Ações de Sistema** (`ConfiguracoesPage.tsx`, RN-004) | Implementer | `T-F3-01` | `ready` |
| `T-F3-09` | **Dropdown de Notificações no Header e Proteção RBAC Geral** (`AdminRoute.tsx`) | Implementer | `T-F3-06`, `T-F3-07` | `ready` |
| `T-F3-10` | **Bateria de Testes Integrados e Homologação QA da Fase 3** | Implementer/QA | `T-F3-09` | `ready` |

---

## 7. 🚀 Critérios de Aceite da Fase 3 (Definition of Done - DoD)

1. [ ] Todas as 16 rotas backend da Fase 3 integradas com Axios e tipadas sem `any`.
2. [ ] Zero falhas de compilação no TypeScript (`npm run build` 100% limpo).
3. [ ] Gráficos do Dashboard renderizando com paleta **Midnight Navy** e responsivos.
4. [ ] Calendário exibindo eventos com cores correspondentes e sincronização Google funcional.
5. [ ] Trilha de Auditoria acessível exclusivamente para administradores com visualização de diff detalhado.
6. [ ] Módulo de Usuários permitindo CRUD completo, redefinição de senha e bloqueio de auto-desativação.
7. [ ] Configuração RN-004 alternando perfeitamente e influenciando os formulários de cadastro.
8. [ ] Matriz de testes de QA com 100% de cobertura nos 12 cenários críticos.
