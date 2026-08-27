import api from '@/services/api';
import { AuditFilterParams, AuditLogItem, AuditLogsResponse } from '../types/audit.types';

export const auditService = {
  /**
   * List audit logs with pagination and filters from GET /audit-logs (Admin only)
   */
  listLogs: async (params?: AuditFilterParams): Promise<AuditLogsResponse> => {
    const cleanParams: Record<string, string | number> = {};
    if (params) {
      if (params.page !== undefined) cleanParams.page = params.page;
      if (params.limit !== undefined) cleanParams.limit = params.limit;
      if (params.documentId) cleanParams.documentId = params.documentId;
      if (params.userId) cleanParams.userId = params.userId;
      if (params.action) cleanParams.action = params.action;
      if (params.search && params.search.trim()) cleanParams.search = params.search.trim();

      if (params.startDate) {
        // Start of day in ISO
        const start = new Date(params.startDate);
        cleanParams.startDate = isNaN(start.getTime()) ? params.startDate : start.toISOString();
      }

      if (params.endDate) {
        // End of day in ISO for inclusive filtering
        const end = new Date(`${params.endDate}T23:59:59.999Z`);
        cleanParams.endDate = isNaN(end.getTime()) ? params.endDate : end.toISOString();
      }
    }

    const response = await api.get<AuditLogsResponse>('/audit-logs', { params: cleanParams });
    return response.data;
  },

  /**
   * Get single audit log detail by ID from GET /audit-logs/:id (Admin only)
   */
  getLogById: async (id: string): Promise<AuditLogItem> => {
    const response = await api.get<{ log: AuditLogItem }>(`/audit-logs/${id}`);
    return response.data.log;
  },
};
