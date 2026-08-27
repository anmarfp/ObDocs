import { Document, DocumentStatus } from '@/features/documents/types/document.types';

export interface SummaryReport {
  totalDocuments: number;
  complianceRate: number;
  statusCounts: Record<DocumentStatus, number>;
}

export interface ReportFilterParams {
  format?: 'csv' | 'json';
  status?: DocumentStatus;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  includeArchived?: boolean;
}

export interface ReportJsonResult {
  documents: Document[];
  total: number;
}
