import { Document } from '@/features/documents/types/document.types';

export interface RecalculateStatusesResult {
  totalProcessed: number;
  updatedCount: number;
  alertsSent: number;
}

export interface DailyDigestSummary {
  critical: Document[];
  expired: Document[];
  total: number;
}

export interface DailyDigestResult {
  success: boolean;
  recipients: string[];
  subject: string;
  total: number;
  summary: DailyDigestSummary;
  sentAt: string;
}
