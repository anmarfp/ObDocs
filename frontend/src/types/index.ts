export * from './auth';
export type {
  DocumentStatus,
  AuditAction,
  NotificationMode,
  SyncStatus,
  UserSummary,
  DocumentCategory,
  DocumentVersion,
  AuditLog,
  GCalSyncLog,
  Document,
  CompanyConfig,
  DocumentFilterParams,
  DocumentListResponse,
} from '../features/documents/types/document.types';

export interface DashboardMetrics {
  total: number;
  expired: number;
  critical: number;
  renewal: number;
  regular: number;
  indeterminate: number;
}
