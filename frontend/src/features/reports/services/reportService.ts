import api from '@/services/api';
import { ReportFilterParams, ReportJsonResult, SummaryReport } from '../types/report.types';

export const reportService = {
  /**
   * Get executive summary from GET /reports/summary
   */
  getSummary: async (params?: ReportFilterParams): Promise<SummaryReport> => {
    const cleanParams: Record<string, string | boolean> = {};
    if (params) {
      if (params.status) cleanParams.status = params.status;
      if (params.categoryId) cleanParams.categoryId = params.categoryId;
      if (params.startDate) cleanParams.startDate = params.startDate;
      if (params.endDate) cleanParams.endDate = params.endDate;
      if (params.includeArchived !== undefined) cleanParams.includeArchived = params.includeArchived;
    }

    const response = await api.get<SummaryReport>('/reports/summary', { params: cleanParams });
    return response.data;
  },

  /**
   * Export report as JSON from GET /reports/export?format=json
   */
  exportJson: async (params?: ReportFilterParams): Promise<ReportJsonResult> => {
    const cleanParams: Record<string, string | boolean> = { format: 'json' };
    if (params) {
      if (params.status) cleanParams.status = params.status;
      if (params.categoryId) cleanParams.categoryId = params.categoryId;
      if (params.startDate) cleanParams.startDate = params.startDate;
      if (params.endDate) cleanParams.endDate = params.endDate;
      if (params.includeArchived !== undefined) cleanParams.includeArchived = params.includeArchived;
    }

    const response = await api.get<ReportJsonResult>('/reports/export', { params: cleanParams });
    return response.data;
  },

  /**
   * Export report as CSV from GET /reports/export?format=csv
   * Extracts filename from Content-Disposition with fallback, handles blob download and cleanup.
   */
  exportCsv: async (params?: ReportFilterParams): Promise<void> => {
    const cleanParams: Record<string, string | boolean> = { format: 'csv' };
    if (params) {
      if (params.status) cleanParams.status = params.status;
      if (params.categoryId) cleanParams.categoryId = params.categoryId;
      if (params.startDate) cleanParams.startDate = params.startDate;
      if (params.endDate) cleanParams.endDate = params.endDate;
      if (params.includeArchived !== undefined) cleanParams.includeArchived = params.includeArchived;
    }

    let response;
    try {
      response = await api.get('/reports/export', {
        params: cleanParams,
        responseType: 'blob',
      });
    } catch (error: any) {
      // If error response is a Blob, try decoding it to read the server error JSON
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const parsed = JSON.parse(errorText);
          throw new Error(parsed.message || parsed.error || 'Falha ao exportar relatório CSV.');
        } catch (parseErr: any) {
          if (parseErr.message && !parseErr.message.includes('JSON')) {
            throw parseErr;
          }
        }
      }
      throw error;
    }

    const disposition = response.headers['content-disposition'];
    const dateStr = new Date().toISOString().split('T')[0];
    let filename = `relatorio-documentos-${dateStr}.csv`;

    if (disposition && typeof disposition === 'string') {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);

    try {
      link.click();
    } finally {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  },
};
