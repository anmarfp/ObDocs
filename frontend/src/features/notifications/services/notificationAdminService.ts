import api from '@/services/api';
import { DailyDigestResult, RecalculateStatusesResult } from '../types/notification.types';

export const notificationAdminService = {
  /**
   * Manually trigger status recalculation and expiration alert dispatch (Admin only) from POST /notifications/recalculate
   */
  recalculateStatuses: async (): Promise<RecalculateStatusesResult> => {
    const response = await api.post<RecalculateStatusesResult>('/notifications/recalculate');
    return response.data;
  },

  /**
   * Manually trigger the Daily Digest email delivery (Admin only) from POST /notifications/digest
   */
  triggerDailyDigest: async (): Promise<DailyDigestResult> => {
    const response = await api.post<DailyDigestResult>('/notifications/digest');
    return response.data;
  },
};
