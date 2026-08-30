import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import {
  getCalendarEvents,
  syncCalendar,
  getSyncLogs,
} from '../controllers/calendarController.js';
import {
  getGoogleAuthUrl,
  handleGoogleAuthCallback,
  getGoogleConnectionStatus,
  disconnectGoogleAccount,
} from '../controllers/googleAuthController.js';

export const calendarRouter = Router();

// Callback do OAuth do Google Agenda (DOC-28): é o navegador do usuário sendo
// redirecionado pelo próprio Google, então não há (nem pode haver) um header
// Authorization: Bearer nessa requisição. Por isso esta rota é registrada
// ANTES do `calendarRouter.use(authMiddleware)` abaixo — no Express, rotas e
// middlewares de um router são avaliados na ordem de registro, então uma
// requisição para este path é respondida aqui sem nunca passar pelo
// authMiddleware. A autenticidade do usuário é garantida pelo `state`
// assinado (ver googleAuthController.ts), não por este endpoint ser protegido.
calendarRouter.get('/google/callback', handleGoogleAuthCallback);

// Demais rotas de calendário exigem autenticação
calendarRouter.use(authMiddleware);

// Listagem de eventos no calendário (ADMIN e OPERATIONAL)
calendarRouter.get('/events', getCalendarEvents);

// Sincronização manual do calendário (ADMIN e OPERATIONAL)
calendarRouter.post('/sync', syncCalendar);

// Logs de sincronização com Google Agenda (Restrito a ADMIN)
calendarRouter.get('/sync-logs', requireRole([Role.ADMIN]), getSyncLogs);

// Conexão OAuth por usuário com o Google Agenda (ADMIN e OPERATIONAL — únicos
// papéis existentes no sistema, ambos autenticados via authMiddleware acima)
calendarRouter.get('/google/connect', getGoogleAuthUrl);
calendarRouter.get('/google/status', getGoogleConnectionStatus);
calendarRouter.delete('/google/status', disconnectGoogleAccount);
