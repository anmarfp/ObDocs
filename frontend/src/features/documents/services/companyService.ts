import api from '@/services/api';
import { CompanyConfig } from '../types/document.types';

export const companyService = {
  /**
   * Get company configuration (including notificationMode).
   */
  getConfig: async (): Promise<CompanyConfig> => {
    const response = await api.get<{ config: CompanyConfig }>('/company/config');
    return response.data.config;
  },

  /**
   * Update company configuration (Admin only).
   */
  updateConfig: async (data: { notificationMode: string }): Promise<CompanyConfig> => {
    const response = await api.put<{ message: string; config: CompanyConfig }>(
      '/company/config',
      data
    );
    return response.data.config;
  },
};
