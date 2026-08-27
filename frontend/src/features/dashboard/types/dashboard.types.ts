import { Document, DocumentStatus } from '@/features/documents/types/document.types';

export interface DashboardCategoryStat {
  categoryId: string;
  categoryName: string;
  colorHex: string | null;
  count: number;
}

export interface DashboardMetrics {
  statusCounts: Record<DocumentStatus, number>;
  totalActive: number;
  totalArchived: number;
  complianceRate: number;
  byCategory: DashboardCategoryStat[];
  upcomingExpirations: Document[];
}
