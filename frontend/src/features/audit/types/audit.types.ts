import { AuditAction, Role } from '@/features/documents/types/document.types';

export interface AuditLogDocumentSummary {
  id: string;
  title: string;
  isArchived: boolean;
}

export interface AuditLogUserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuditLogItem {
  id: string;
  documentId: string | null;
  userId: string | null;
  userName: string;
  action: AuditAction;
  diffData: Record<string, { old?: unknown; new?: unknown } | unknown>;
  timestamp: string;
  document?: AuditLogDocumentSummary | null;
  user?: AuditLogUserSummary | null;
}

export interface AuditLogsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  logs: AuditLogItem[];
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
