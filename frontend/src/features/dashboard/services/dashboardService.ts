import api from '@/services/api';
import { DashboardMetrics } from '../types/dashboard.types';

export const dashboardService = {
  /**
   * Get consolidated dashboard metrics from GET /dashboard/metrics
   */
  getMetrics: async (): Promise<DashboardMetrics> => {
    const response = await api.get<DashboardMetrics>('/dashboard/metrics');
    return response.data;
  },
};
