# 📋 Plano Arquitetural da Fase 2: Módulo de Documentos (DocsOb Frontend)

**Projeto:** DocsOb — Gestão de Vencimento de Documentos  
**Agente Responsável:** Planner (`plan-orchestrator`)  
**Status:** Pronto para Execução / Aprovado para Implementação  
**Data:** 27/08/2026  
**Stack Frontend:** React 18/19, TypeScript, Vite, Tailwind CSS (Midnight Navy Theme), Axios, AuthContext, Lucide React, Zod, React Hook Form  
**Backend Vinculado:** Express + TypeScript + Prisma ORM + PostgreSQL (100% testado e integrado)  

---

## 📑 Sumário Executivo

A **Fase 2** do frontend do DocsOb compreende a entrega do **Módulo Central de Documentos**, o coração operacional do sistema. Este módulo viabiliza o ciclo de vida completo dos documentos regulatórios e operacionais da empresa, compreendendo:

1. **Gestão Visual e Listagem Densa:** Tabela de alta densidade com Matriz de Cores em tempo real (🔴 Vencido, 🟡 Alerta Crítico, 🔵 Em Renovação, 🟢 Em Dia, ⚪ Indeterminado).
2. **Motor de Filtros Avançado e Busca Debounced:** Filtragem dinâmica por Categoria, Status, Responsável, Período, Busca Full-text (título, emissor, protocolo) e alternador de documentos arquivados com proteção RBAC (somente Administradores).
3. **Upload Moderno com Drag & Drop:** Componente interativo de upload com validação de formato (`.pdf`, `.png`, `.jpg`, `.jpeg`), barreira de tamanho (máximo 10 MB - `10485760 bytes`), indicador de progresso via Axios e visualização/remoção prévia.
4. **Cadastro e Edição Condicional (RN-004):** Formulários integrados com validação Zod que respondem dinamicamente ao modo de notificação da empresa (`ALL_ADMINS` vs `ONLY_RESPONSIBLE`).
5. **Ciclo de Renovação de Documentos com Histórico Imutável (RN-002 e RN-008):** Modal especializado de renovação (`POST /api/v1/documents/:id/renew`) que arquiva a versão anterior em snapshot versionado e restabelece o documento com novo prazo e anexo.
6. **Visualização Completa de Detalhes e Auditoria:** Modal/página de detalhes com visualização de metadados, download seguro de anexos, linha do tempo de versões históricas e mini trilha de auditoria.
7. **Controle de Acesso Baseado em Papéis (RBAC - RF-014):** Proteção visual e operacional nas ações de Soft Delete (arquivar), Hard Delete (exclusão definitiva restrita a `ADMIN`) e visualização de arquivados.

---

## 1. 🏗️ Arquitetura de Diretórios e Componentes (`frontend/src/`)

A estrutura segue a arquitetura modular baseada em *Features* e *Shared Components*, garantindo separação de responsabilidades, alta coesão e facilidade de testes unitários e de integração.

```
frontend/src/
├── assets/
│   └── icons/
├── components/
│   ├── common/
│   │   ├── Badge.tsx                      # Componente base de badge estilizada
│   │   ├── Button.tsx                     # Botão com variantes (primary, secondary, danger, ghost) e loading spinner
│   │   ├── Dialog.tsx                     # Modal acessível (Backdrop, Trap Focus, ESC listener)
│   │   ├── Input.tsx                      # Input de texto/data com label, help text e exibição de erro
│   │   ├── Select.tsx                     # Dropdown estilizado com suporte a placeholder
│   │   ├── Textarea.tsx                   # Campo de texto multilinhas
│   │   ├── Tooltip.tsx                    # Dicas flutuantes ao passar o cursor
│   │   ├── Skeleton.tsx                   # Placeholder animado para estados de carregamento
│   │   └── Toast.tsx                      # Notificações flutuantes (sucesso, erro, alerta, info)
│   ├── feedback/
│   │   ├── LoadingOverlay.tsx             # Overlay de carregamento com spinner e blur
│   │   └── ConfirmDialog.tsx              # Diálogo genérico de confirmação para ações críticas
│   ├── layout/
│   │   ├── AppShell.tsx                   # Layout base com Header superior e Sidebar retrátil
│   │   ├── Header.tsx                     # Top Header com busca rápida, sino de notificações e avatar do usuário
│   │   ├── Sidebar.tsx                    # Menu de navegação lateral retrátil com controle de permissão RBAC
│   │   └── UserDropdown.tsx               # Dropdown com dados da sessão e logout
│   └── upload/
│       └── FileDropzone.tsx               # Componente Drag & Drop com validação de MIME, tamanho e preview
├── context/
│   ├── AuthContext.tsx                    # Provedor de autenticação (JWT, dados do usuário e role)
│   └── ToastContext.tsx                   # Provedor e hook global para disparo de alertas e notificações
├── features/
│   └── documents/
│       ├── components/
│       │   ├── DocumentFilters.tsx        # Barra de filtros (busca, categoria, status, arquivados, reset)
│       │   ├── DocumentTable.tsx          # Tabela densa de documentos com suporte a seleção e paginação
│       │   ├── DocumentTableRow.tsx       # Linha da tabela com renderização das células e menu de ações
│       │   ├── DocumentTableSkeleton.tsx  # Esqueleto de carregamento com shimmer effect
│       │   ├── DocumentStatusBadge.tsx    # Badge com Matriz de Cores e dot pulsante (RN-001)
│       │   ├── DocumentActionsMenu.tsx    # Menu flutuante de ações rápidas (Editar, Renovar, Arquivar, Deletar)
│       │   ├── DocumentUploadModal.tsx    # Modal de criação e edição de documentos (com FileDropzone)
│       │   ├── DocumentDetailsModal.tsx   # Modal de visualização completa com histórico e audit trail
│       │   ├── DocumentRenewModal.tsx     # Modal específico de renovação com incremento de versão
│       │   ├── DocumentVersionsList.tsx   # Linha do tempo das versões arquivadas do documento
│       │   ├── DocumentAuditTrail.tsx     # Mini listagem de logs de alteração do documento
│       │   ├── DocumentArchiveDialog.tsx  # Confirmação de arquivamento (Soft Delete)
│       │   └── DocumentDeleteDialog.tsx   # Confirmação de exclusão física permanente (Hard Delete - Admin)
│       ├── hooks/
│       │   ├── useDocuments.ts            # Hook principal de listagem, paginação, filtros e refetch
│       │   ├── useDocumentMutations.ts    # Hook com mutations de criação, edição, renovação e exclusão
│       │   └── useDocumentDetails.ts      # Hook para busca de detalhes, versões e logs do documento
│       ├── services/
│       │   └── documentService.ts         # Camada Axios dedicada para chamadas da API de documentos
│       └── types/
│           └── document.types.ts          # Contratos TypeScript de tipos, DTOs e enums de documentos
├── hooks/
│   ├── useDebounce.ts                     # Hook utilitário para debounce de digitação na busca
│   └── useCategories.ts                   # Hook para listagem e cache de categorias cadastradas
├── pages/
│   └── DocumentosPage.tsx                 # Página principal do Repositório de Documentos (/documentos)
├── services/
│   ├── api.ts                             # Instância configurada do Axios com interceptors de JWT e erro
│   └── categoryService.ts                 # Serviço de comunicação com /api/v1/categories
├── styles/
│   └── index.css                          # Estilos globais Tailwind + variáveis da paleta Midnight Navy
├── types/
│   ├── api.types.ts                       # Tipagens globais de resposta da API (paginação, erros, responses)
│   └── auth.types.ts                      # Tipagens de usuário, roles e token de autenticação
└── utils/
    ├── date.utils.ts                      # Formatadores de data pt-BR, cálculo de dias restantes e relativos
    ├── file.utils.ts                      # Formatador de tamanho de arquivo (KB, MB), validadores de MIME
    └── status.utils.ts                    # Utilitário de cores, textos e cálculo do status visual no cliente
```

---

## 2. 📝 Contratos TypeScript e Interfaces de Dados

### 2.1 Enums e Tipos Fundamentais (`types/document.types.ts`)

```typescript
/**
 * Papéis de usuário no sistema DocsOb (RBAC)
 */
export type UserRole = 'ADMIN' | 'OPERATIONAL';

/**
 * Matriz de Status Visual do Documento (RN-001)
 */
export enum DocumentStatus {
  EXPIRED = 'EXPIRED',                         // 🔴 Vencido (Data atual > expirationDate)
  CRITICAL = 'CRITICAL',                       // 🟡 Alerta Crítico (expirationDate - hoje <= alertLeadDays)
  RENEWAL_IN_PROGRESS = 'RENEWAL_IN_PROGRESS', // 🔵 Em Renovação (Processo iniciado)
  REGULAR = 'REGULAR',                         // 🟢 Em Dia / Regular (Dentro do prazo)
  INDETERMINATE = 'INDETERMINATE',             // ⚪ Indeterminado (Sem data de vencimento)
}

/**
 * Tipos de ações registradas na Trilha de Auditoria (RN-008)
 */
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'ARCHIVE' 
  | 'UNARCHIVE' 
  | 'DELETE' 
  | 'RENEW';

/**
 * Categoria de documento
 */
export interface DocumentCategory {
  id: string;
  name: string;
  colorHex?: string | null;
  description?: string | null;
  createdAt: string;
  documentCount?: number;
}

/**
 * Resumo do usuário criador ou responsável
 */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Versão histórica arquivada de um documento (Snapshot)
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  issueDate: string;
  expirationDate: string | null;
  attachmentUrl: string | null;
  attachmentFilename: string | null;
  notes: string | null;
  renewedById: string;
  renewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

/**
 * Registro de log de auditoria associado ao documento
 */
export interface DocumentAuditLog {
  id: string;
  documentId: string | null;
  userId: string | null;
  userName: string;
  action: AuditAction;
  diffData: Record<string, { old: unknown; new: unknown }>;
  timestamp: string;
}

/**
 * Entidade Documento (Listagem Principal)
 */
export interface DocumentItem {
  id: string;
  title: string;
  categoryId: string;
  category: DocumentCategory;
  issuingBody: string | null;
  issueDate: string;
  expirationDate: string | null;
  alertLeadDays: number;
  status: DocumentStatus;
  responsibleName: string | null;
  responsibleEmail: string | null;
  attachmentUrl: string | null;
  attachmentFilename: string | null;
  fileSizeBytes: number | null;
  fileMimeType: string | null;
  notes: string | null;
  isArchived: boolean;
  createdById: string;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
  versions?: DocumentVersion[];
  _count?: {
    versions: number;
    auditLogs: number;
  };
}

/**
 * Detalhes Completos do Documento (Visualização Específica)
 */
export interface DocumentDetail extends DocumentItem {
  versions: DocumentVersion[];
  auditLogs: DocumentAuditLog[];
  gcalSyncLogs?: Array<{
    id: string;
    status: 'SYNCED' | 'ERROR';
    lastSyncedAt: string;
    errorMessage?: string | null;
  }>;
}
```

### 2.2 DTOs de Requisição e Resposta (API Payloads)

```typescript
/**
 * Parâmetros de consulta e filtragem para GET /api/v1/documents
 */
export interface DocumentFilterParams {
  search?: string;
  categoryId?: string;
  status?: DocumentStatus | '';
  includeArchived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'expirationDate' | 'issueDate' | 'createdAt' | 'status';
  order?: 'asc' | 'desc';
}

/**
 * DTO para Criação de Documento (POST /api/v1/documents)
 */
export interface CreateDocumentInput {
  title: string;
  categoryId: string;
  issuingBody?: string | null;
  issueDate: string;                           // Formato YYYY-MM-DD
  expirationDate?: string | null;              // Formato YYYY-MM-DD ou null se indeterminado
  alertLeadDays?: number;                      // Padrão: 30
  responsibleName?: string | null;             // Obrigatório se notificationMode == ONLY_RESPONSIBLE
  responsibleEmail?: string | null;            // Obrigatório se notificationMode == ONLY_RESPONSIBLE
  notes?: string | null;
  isRenewalInProgress?: boolean;
  attachment?: File | null;                    // Arquivo físico enviado via FormData
}

/**
 * DTO para Atualização de Metadados (PUT /api/v1/documents/:id)
 */
export interface UpdateDocumentInput {
  title?: string;
  categoryId?: string;
  issuingBody?: string | null;
  issueDate?: string;
  expirationDate?: string | null;
  alertLeadDays?: number;
  responsibleName?: string | null;
  responsibleEmail?: string | null;
  notes?: string | null;
  status?: DocumentStatus;
  isRenewalInProgress?: boolean;
  attachment?: File | null;
}

/**
 * DTO para Renovação de Documento (POST /api/v1/documents/:id/renew)
 */
export interface RenewDocumentInput {
  issueDate: string;                           // Nova data de emissão
  expirationDate?: string | null;              // Nova data de vencimento
  notes?: string | null;                       // Notas sobre o processo de renovação
  attachment?: File | null;                    // Novo comprovante/minuta em PDF/imagem
}

/**
 * Resposta de Listagem Paginada da API
 */
export interface DocumentListResponse {
  documents: DocumentItem[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Resposta de Detalhes da API
 */
export interface DocumentDetailResponse {
  document: DocumentDetail;
}

/**
 * Resposta de Renovação
 */
export interface DocumentRenewResponse {
  message: string;
  document: DocumentDetail;
  previousVersionNumber: number;
}

/**
 * Resposta Padrão de Mutação / Exclusão
 */
export interface DocumentActionResponse {
  message: string;
  document?: DocumentItem;
}
```

---

## 3. 🎨 Design System & Especificação Visual (Midnight Navy)

A interface utiliza Tailwind CSS baseada na paleta de cores corporativa escura **Midnight Navy**, com visual de alta densidade de dados, glassmorphism suave e tipografia nítida:

### 3.1 Tokens de Cores e Variáveis

| Elemento | Classe Tailwind / Hex | Descrição Visual |
| :--- | :--- | :--- |
| **App Background** | `bg-slate-950` (`#0b0f19`) | Fundo ultra escuro elegante para redução de fadiga visual |
| **Card / Surface** | `bg-slate-900/80` (`#111827`) + `border-slate-800` | Superfície com leve transparência e borda sutil de divisão |
| **Header / Sidebar** | `bg-slate-900` (`#0f172a`) + `border-slate-800` | Barra de navegação e menu lateral escuros integrados |
| **Texto Primário** | `text-slate-100` (`#f8fafc`) | Alto contraste para leitura de títulos e valores de células |
| **Texto Secundário** | `text-slate-400` (`#94a3b8`) | Textos auxiliares, emissores, legendas e rótulos |
| **Primary Brand Accent** | `bg-blue-600` (`#2563eb`) / `hover:bg-blue-500` | Cor de destaque primária para botões de ação e links ativos |
| **Hover de Linhas** | `hover:bg-slate-800/50` | Efeito sutil ao passar o cursor sobre as linhas da tabela |

### 3.2 Matriz de Cores e Estilos dos Status (RN-001)

| Status | Badge Background & Borda | Dot Pulsante | Texto do Badge | Significado |
| :--- | :--- | :--- | :--- | :--- |
| **🔴 Vencido (`EXPIRED`)** | `bg-rose-950/40 border-rose-800/60` | `bg-rose-500 shadow-rose-500/50` | `text-rose-400` | Documento com data expirada |
| **🟡 Alerta Crítico (`CRITICAL`)** | `bg-amber-950/40 border-amber-800/60` | `bg-amber-500 shadow-amber-500/50` | `text-amber-300` | Faltam $\le$ `alertLeadDays` dias |
| **🔵 Em Renovação (`RENEWAL_IN_PROGRESS`)** | `bg-blue-950/40 border-blue-800/60` | `bg-blue-500 shadow-blue-500/50` | `text-blue-300` | Processo de renovação em andamento |
| **🟢 Em Dia (`REGULAR`)** | `bg-emerald-950/40 border-emerald-800/60` | `bg-emerald-500 shadow-emerald-500/50` | `text-emerald-300` | Documento dentro da validade segura |
| **⚪ Indeterminado (`INDETERMINATE`)** | `bg-slate-800/60 border-slate-700` | `bg-slate-400` | `text-slate-300` | Documento sem data de expiração |

---

## 4. ⚙️ Fluxo de Estado, Formulários, Loading e Tratamento de Erros

### 4.1 Camada de Comunicação com a API (`documentService.ts`)

```typescript
import api from '@/services/api';
import {
  DocumentItem,
  DocumentDetail,
  DocumentFilterParams,
  DocumentListResponse,
  DocumentDetailResponse,
  DocumentRenewResponse,
  DocumentActionResponse,
  CreateDocumentInput,
  UpdateDocumentInput,
  RenewDocumentInput,
} from '@/features/documents/types/document.types';

export const documentService = {
  /**
   * Busca lista paginada e filtrada de documentos
   */
  async getDocuments(params: DocumentFilterParams = {}): Promise<DocumentListResponse> {
    const { data } = await api.get<DocumentListResponse>('/api/v1/documents', { params });
    return data;
  },

  /**
   * Obtém detalhes completos de um documento por ID
   */
  async getDocumentById(id: string): Promise<DocumentDetail> {
    const { data } = await api.get<DocumentDetailResponse>(`/api/v1/documents/${id}`);
    return data.document;
  },

  /**
   * Cadastra novo documento com upload multipart/form-data
   */
  async createDocument(
    input: CreateDocumentInput,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<{ message: string; document: DocumentItem }> {
    const formData = new FormData();
    formData.append('title', input.title);
    formData.append('categoryId', input.categoryId);
    formData.append('issueDate', input.issueDate);
    
    if (input.issuingBody) formData.append('issuingBody', input.issuingBody);
    if (input.expirationDate) formData.append('expirationDate', input.expirationDate);
    if (input.alertLeadDays) formData.append('alertLeadDays', String(input.alertLeadDays));
    if (input.responsibleName) formData.append('responsibleName', input.responsibleName);
    if (input.responsibleEmail) formData.append('responsibleEmail', input.responsibleEmail);
    if (input.notes) formData.append('notes', input.notes);
    if (input.isRenewalInProgress !== undefined) {
      formData.append('isRenewalInProgress', String(input.isRenewalInProgress));
    }
    if (input.attachment) {
      formData.append('attachment', input.attachment);
    }

    const { data } = await api.post<{ message: string; document: DocumentItem }>(
      '/api/v1/documents',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    );
    return data;
  },

  /**
   * Atualiza metadados e/ou substitui anexo de um documento existente
   */
  async updateDocument(
    id: string,
    input: UpdateDocumentInput,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<{ message: string; document: DocumentItem }> {
    const formData = new FormData();
    if (input.title !== undefined) formData.append('title', input.title);
    if (input.categoryId !== undefined) formData.append('categoryId', input.categoryId);
    if (input.issuingBody !== undefined) formData.append('issuingBody', input.issuingBody || '');
    if (input.issueDate !== undefined) formData.append('issueDate', input.issueDate);
    if (input.expirationDate !== undefined) formData.append('expirationDate', input.expirationDate || '');
    if (input.alertLeadDays !== undefined) formData.append('alertLeadDays', String(input.alertLeadDays));
    if (input.responsibleName !== undefined) formData.append('responsibleName', input.responsibleName || '');
    if (input.responsibleEmail !== undefined) formData.append('responsibleEmail', input.responsibleEmail || '');
    if (input.notes !== undefined) formData.append('notes', input.notes || '');
    if (input.status !== undefined) formData.append('status', input.status);
    if (input.isRenewalInProgress !== undefined) {
      formData.append('isRenewalInProgress', String(input.isRenewalInProgress));
    }
    if (input.attachment) {
      formData.append('attachment', input.attachment);
    }

    const { data } = await api.put<{ message: string; document: DocumentItem }>(
      `/api/v1/documents/${id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    );
    return data;
  },

  /**
   * Executa a renovação do documento (arquiva versão atual e salva novas datas/anexo)
   */
  async renewDocument(
    id: string,
    input: RenewDocumentInput,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<DocumentRenewResponse> {
    const formData = new FormData();
    formData.append('issueDate', input.issueDate);
    if (input.expirationDate) formData.append('expirationDate', input.expirationDate);
    if (input.notes) formData.append('notes', input.notes);
    if (input.attachment) formData.append('attachment', input.attachment);

    const { data } = await api.post<DocumentRenewResponse>(
      `/api/v1/documents/${id}/renew`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress,
      }
    );
    return data;
  },

  /**
   * Alterna o arquivamento do documento (Soft Delete / Desarquivar)
   */
  async toggleArchive(id: string): Promise<DocumentActionResponse> {
    const { data } = await api.patch<DocumentActionResponse>(`/api/v1/documents/${id}/archive`);
    return data;
  },

  /**
   * Exclui permanentemente um documento e seu anexo do disco (Hard Delete - Admin)
   */
  async deleteDocument(id: string): Promise<DocumentActionResponse> {
    const { data } = await api.delete<DocumentActionResponse>(`/api/v1/documents/${id}`);
    return data;
  },
};
```

### 4.2 Esquemas de Validação com Zod e Condicionalidade (RN-004)

```typescript
import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB em bytes
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

/**
 * Esquema de validação para criação de documento
 */
export const createDocumentFormSchema = (isResponsibleRequired: boolean) =>
  z.object({
    title: z
      .string({ required_error: 'O título do documento é obrigatório.' })
      .trim()
      .min(2, 'O título deve ter pelo menos 2 caracteres.')
      .max(200, 'O título não pode exceder 200 caracteres.'),
    categoryId: z
      .string({ required_error: 'Selecione uma categoria.' })
      .uuid('Categoria selecionada é inválida.'),
    issuingBody: z
      .string()
      .trim()
      .max(150, 'Órgão emissor não pode exceder 150 caracteres.')
      .optional()
      .nullable(),
    issueDate: z
      .string({ required_error: 'A data de emissão é obrigatória.' })
      .refine((val) => !isNaN(Date.parse(val)), 'Data de emissão inválida.'),
    isIndeterminate: z.boolean().default(false),
    expirationDate: z
      .string()
      .optional()
      .nullable(),
    alertLeadDays: z
      .coerce
      .number({ invalid_type_error: 'Informe um número válido de dias.' })
      .int('Deve ser um número inteiro.')
      .min(1, 'A antecedência mínima é de 1 dia.')
      .max(365, 'A antecedência máxima é de 365 dias.')
      .default(30),
    responsibleName: isResponsibleRequired
      ? z.string({ required_error: 'O nome do responsável é obrigatório.' }).trim().min(2, 'Informe o nome do responsável.')
      : z.string().trim().optional().nullable(),
    responsibleEmail: isResponsibleRequired
      ? z.string({ required_error: 'O e-mail do responsável é obrigatório.' }).trim().email('E-mail do responsável inválido.')
      : z.string().trim().email('E-mail inválido.').optional().nullable().or(z.literal('')),
    notes: z.string().max(2000, 'Observações não podem exceder 2000 caracteres.').optional().nullable(),
    isRenewalInProgress: z.boolean().default(false),
    file: z
      .instanceof(File)
      .optional()
      .nullable()
      .refine((file) => !file || file.size <= MAX_FILE_SIZE, 'O arquivo deve ter no máximo 10 MB.')
      .refine(
        (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
        'Formato inválido. Apenas PDF, PNG e JPG são aceitos.'
      ),
  }).refine(
    (data) => {
      // Se não for prazo indeterminado, expirationDate é obrigatório e deve ser >= issueDate
      if (!data.isIndeterminate) {
        if (!data.expirationDate || data.expirationDate.trim() === '') return false;
        return Date.parse(data.expirationDate) >= Date.parse(data.issueDate);
      }
      return true;
    },
    {
      message: 'A data de vencimento deve ser informada e ser posterior ou igual à data de emissão.',
      path: ['expirationDate'],
    }
  );

/**
 * Esquema de validação para renovação de documento
 */
export const renewDocumentFormSchema = z.object({
  issueDate: z
    .string({ required_error: 'A nova data de emissão é obrigatória.' })
    .refine((val) => !isNaN(Date.parse(val)), 'Data de emissão inválida.'),
  isIndeterminate: z.boolean().default(false),
  expirationDate: z.string().optional().nullable(),
  notes: z.string().max(2000, 'Observações não podem exceder 2000 caracteres.').optional().nullable(),
  file: z
    .instanceof(File)
    .optional()
    .nullable()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, 'O novo arquivo deve ter no máximo 10 MB.')
    .refine(
      (file) => !file || ACCEPTED_FILE_TYPES.includes(file.type),
      'Formato inválido. Apenas PDF, PNG e JPG são aceitos.'
    ),
}).refine(
  (data) => {
    if (!data.isIndeterminate) {
      if (!data.expirationDate || data.expirationDate.trim() === '') return false;
      return Date.parse(data.expirationDate) >= Date.parse(data.issueDate);
    }
    return true;
  },
  {
    message: 'A data de vencimento da nova versão deve ser posterior ou igual à nova data de emissão.',
    path: ['expirationDate'],
  }
);
```

### 4.3 Especificação do Componente `FileDropzone.tsx`

```
+-------------------------------------------------------------------------+
|  [ ☁️ Ícone de Nuvem / Upload ]                                         |
|  Arraste e solte o arquivo aqui ou clique para selecionar               |
|  PDF, PNG ou JPG (Tamanho máximo permitido: 10 MB)                      |
+-------------------------------------------------------------------------+
| Estado de Arquivo Anexado:                                              |
|  [ 📄 Ícone PDF ] cnd_federal_2026.pdf (2.4 MB)        [ 🗑️ Remover ]    |
|  [ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100% Pronto ]     |
+-------------------------------------------------------------------------+
```

**Comportamento e Estados:**
1. **Idle (Padrão):** Borda tracejada `border-slate-700`, fundo `bg-slate-900/40`, texto convidativo.
2. **Drag Over (Arrastando):** Borda destacada `border-blue-500`, fundo animado `bg-blue-950/20`, escala `scale-[1.01]`.
3. **Validação Instantânea:**
   - Se arquivo $> 10\text{ MB}$, bloqueia imediatamente e emite aviso: *"Arquivo excede o limite máximo de 10 MB"*.
   - Se tipo não for PDF/Imagem, bloqueia com aviso: *"Tipo de arquivo não suportado. Utilize PDF, PNG ou JPG"*.
4. **Preview & Ações:**
   - Exibe nome do arquivo, tamanho formatado e botão de exclusão imediata.
   - Suporte a substituição direta de arquivo.

### 4.4 Mapeamento de Códigos de Erro da API e Toasts

| Código HTTP | Erro da API | Mensagem Traduzida e Amigável para o Usuário (Toast) |
| :--- | :--- | :--- |
| `400` | `RESPONSIBLE_REQUIRED` | ⚠️ **Responsável Obrigatório:** A empresa opera no modo "Apenas Responsável". Preencha o nome e e-mail do encarregado. |
| `400` | `CATEGORY_IN_USE` | ⚠️ **Categoria em Uso:** Não é possível excluir categorias que possuam documentos associados. |
| `401` | `UNAUTHORIZED` | 🔒 **Sessão Expirada:** Faça login novamente para continuar. Redirecionando... |
| `403` | `FORBIDDEN` | 🚫 **Acesso Negado:** Apenas Administradores têm permissão para executar esta ação. |
| `404` | `DOCUMENT_NOT_FOUND` | 🔍 **Não Encontrado:** O documento solicitado não existe ou você não possui acesso a ele. |
| `404` | `CATEGORY_NOT_FOUND` | 🔍 **Categoria Inválida:** A categoria selecionada não foi encontrada no sistema. |
| `413` | `LIMIT_FILE_SIZE` | 📁 **Arquivo Muito Grande:** O tamanho do anexo ultrapassou o limite máximo de 10 MB. |
| `500` | `INTERNAL_SERVER_ERROR`| ❌ **Erro Inesperado:** Ocorreu uma falha no servidor. Tente novamente em instantes. |

---

## 5. 🧪 Plano de Validação e Casos de Teste para QA

O time de QA deverá cobrir rigorosamente a seguinte matriz de testes manuais e automatizados (Vitest + React Testing Library + Playwright/Cypress):

```
+=======================================================================================================+
|                                    MATRIZ DE TESTES DE QA - FASE 2                                   |
+=========+=======================================+=============================================+=======+
| ID      | Cenário de Teste                      | Critério de Sucesso Esperado                | Tipo  |
+=========+=======================================+=============================================+=======+
| TC-01   | Listagem paginada e filtros combinados| Filtros de categoria + status + busca       | E2E   |
|         |                                       | executam debounce e atualizam a tabela      |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-02   | Cadastro de documento com anexo PDF   | POST 201 com multipart, status calculado    | Int.  |
|         |                                       | corretamente e documento listado na tabela  |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-03   | Validação da Regra RN-004             | Se modo for ONLY_RESPONSIBLE, bloqueia envio| Unit. |
|         | (Responsável obrigatório)             | sem nome e email com validação Zod na tela  |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-04   | Validação de Anexo > 10 MB e tipo     | Impede upload, exibe toast e limpa preview  | Unit. |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-05   | Renovação de documento (POST /renew)  | Cria snapshot no histórico, atualiza versão,| E2E   |
|         |                                       | redefine status para REGULAR e fecha modal  |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-06   | Ação rápida "Em Renovação" (🔵)       | Atualiza status visual para RENEWAL_IN_PROG | Int.  |
|         |                                       | sem alterar datas de vencimento             |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-07   | Soft Delete (Arquivamento) e RBAC     | Documento arquivado some para Operacional e | RBAC  |
|         |                                       | fica visível para Admin com switch ativo    |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-08   | Hard Delete permanente (Admin Only)   | Exclui documento do banco e arquivo físico, | RBAC  |
|         |                                       | botão inexistente para papel Operacional    |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-09   | Documentos de Prazo Indeterminado     | Checkbox desabilita vencimento, status fica | Unit. |
|         |                                       | ⚪ INDETERMINATE e não gera alerta falso     |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-10   | Upload Drag & Drop interativo         | Suporta arrastar e soltar arquivo, hover    | Comp. |
|         |                                       | responsivo e remoção antes do submit        |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-11   | Modal de Detalhes e Linha do Tempo    | Exibe metadados, links de download e lista  | Comp. |
|         | de Versões Anteriores                 | cronológica reversa de versões arquivadas   |       |
+---------+---------------------------------------+---------------------------------------------+-------+
| TC-12   | Tratamento de Queda de Rede / 500     | Exibe Toast de erro amigável e botão de     | Int.  |
|         |                                       | "Tentar Novamente" sem crashar a aplicação  |       |
+=========+=======================================+=============================================+=======+
```

---

## 6. 📅 Cronograma de Implementação e Tarefas Kanban

As tarefas a seguir devem ser executadas em sequência ordenada pelo time de desenvolvimento:

| ID Tarefa | Título da Tarefa | Responsável | Dependência | Status |
| :--- | :--- | :---: | :---: | :---: |
| `T-F2-01` | **Tipagens, DTOs e Camada de Serviços Axios** (`types/document.types.ts`, `documentService.ts`) | Implementer | Setup Base | `ready` |
| `T-F2-02` | **Componente Reutilizável de Upload Drag & Drop** (`FileDropzone.tsx`) com validação de 10MB | Implementer | `T-F2-01` | `ready` |
| `T-F2-03` | **Componentes de Status e Tabela Densa** (`DocumentStatusBadge.tsx`, `DocumentTable.tsx`, `Skeleton`) | Implementer | `T-F2-01` | `ready` |
| `T-F2-04` | **Barra de Filtros, Busca Debounce e Alternador de Arquivados** (`DocumentFilters.tsx`) | Implementer | `T-F2-03` | `ready` |
| `T-F2-05` | **Modal de Cadastro e Edição de Documentos** (`DocumentUploadModal.tsx`, validação RN-004) | Implementer | `T-F2-02` | `ready` |
| `T-F2-06` | **Modal Especializado de Renovação** (`DocumentRenewModal.tsx`, snapshot de versão) | Implementer | `T-F2-05` | `ready` |
| `T-F2-07` | **Modal de Detalhes, Histórico de Versões e Audit Trail** (`DocumentDetailsModal.tsx`) | Implementer | `T-F2-06` | `ready` |
| `T-F2-08` | **Diálogos de Confirmação e Regras de Exclusão/Arquivamento RBAC** (Soft/Hard Delete) | Implementer | `T-F2-07` | `ready` |
| `T-F2-09` | **Integração na Página `DocumentosPage.tsx` e Testes de Validação QA** | Implementer/QA | `T-F2-08` | `ready` |

---

## 7. 🚀 Critérios de Aceite da Fase 2 (Definition of Done - DoD)

1. [ ] Todas as 8 rotas de API do backend (`GET`, `POST`, `PUT`, `DELETE`, `/renew`, `/archive`, `/versions`, `/categories`) integradas e funcionais.
2. [ ] Zero erros de compilação TypeScript (`npm run build` executando com sucesso e tipo estrito).
3. [ ] Upload Drag & Drop funcional com barreira rígida de 10 MB e preview/remoção de arquivo.
4. [ ] Matriz de Cores em conformidade com as regras de negócio (`EXPIRED`, `CRITICAL`, `RENEWAL_IN_PROGRESS`, `REGULAR`, `INDETERMINATE`).
5. [ ] Regra RN-004 obedecida (exigência condicional de responsável com base na configuração global da empresa).
6. [ ] Ações destrutivas com diálogos de confirmação e restrição de Hard Delete / Arquivados para perfil `OPERATIONAL`.
7. [ ] Interface 100% responsiva e alinhada com o tema **Midnight Navy**.
8. [ ] Cobertura de testes de QA com 100% dos cenários críticos aprovados.
