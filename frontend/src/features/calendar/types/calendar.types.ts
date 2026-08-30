import { DocumentStatus, SyncStatus } from '@/features/documents/types/document.types';

export interface CalendarEventCategory {
  id: string;
  name: string;
  colorHex?: string | null;
  description?: string | null;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  expirationDate: string | null;
  status: DocumentStatus;
  category: CalendarEventCategory | null;
  colorHex?: string;
}

export interface CalendarEventsResponse {
  events: CalendarEventItem[];
}

export interface CalendarSyncResult {
  total: number;
  synced: number;
}

export interface SyncLogItem {
  id: string;
  documentId: string;
  gcalEventId: string | null;
  status: SyncStatus;
  lastSyncedAt: string;
  errorMessage: string | null;
  document?: {
    id: string;
    title: string;
  };
}

export interface SyncLogsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  logs: SyncLogItem[];
}

/**
 * Status da conexão OAuth por usuário com o Google Agenda (DOC-28, subtarefa 2).
 * Nunca carrega os valores dos tokens — apenas se existe uma conexão ativa.
 */
export interface GoogleConnectionStatus {
  connected: boolean;
}
