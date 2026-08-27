import api from '@/services/api';
import {
  CalendarEventItem,
  CalendarEventsResponse,
  CalendarSyncResult,
  SyncLogsResponse,
} from '../types/calendar.types';

export const calendarService = {
  /**
   * Get calendar expiration events from GET /calendar/events
   * Note: year and month (1..12) should be sent together for monthly filtering.
   */
  getEvents: async (year?: number, month?: number): Promise<CalendarEventItem[]> => {
    const params: Record<string, number> = {};
    if (year !== undefined) {
      params.year = year;
      if (month !== undefined) {
        params.month = month;
      }
    }

    const response = await api.get<CalendarEventsResponse>('/calendar/events', { params });
    return response.data.events;
  },

  /**
   * Trigger manual calendar sync with Google Agenda (local/simulated) from POST /calendar/sync
   */
  syncCalendar: async (): Promise<CalendarSyncResult> => {
    const response = await api.post<CalendarSyncResult>('/calendar/sync');
    return response.data;
  },

  /**
   * Get Google Calendar synchronization logs (Admin only) from GET /calendar/sync-logs
   */
  getSyncLogs: async (page = 1, limit = 20): Promise<SyncLogsResponse> => {
    const response = await api.get<SyncLogsResponse>('/calendar/sync-logs', {
      params: { page, limit },
    });
    return response.data;
  },
};
