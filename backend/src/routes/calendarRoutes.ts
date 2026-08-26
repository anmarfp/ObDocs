import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import {
  getCalendarEvents,
  syncCalendar,
  getSyncLogs,
} from '../controllers/calendarController.js';

export const calendarRouter = Router();

// Todas as rotas de calendário exigem autenticação
calendarRouter.use(authMiddleware);

// Listagem de eventos no calendário (ADMIN e OPERATIONAL)
calendarRouter.get('/events', getCalendarEvents);

// Sincronização manual do calendário (ADMIN e OPERATIONAL)
calendarRouter.post('/sync', syncCalendar);

// Logs de sincronização com Google Agenda (Restrito a ADMIN)
calendarRouter.get('/sync-logs', requireRole([Role.ADMIN]), getSyncLogs);
