import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import {
  recalculateStatuses,
  triggerDigest,
} from '../controllers/notificationController.js';

export const notificationRouter = Router();

// Todas as rotas de notificação manual/cron exigem autenticação e perfil ADMIN
notificationRouter.use(authMiddleware);
notificationRouter.use(requireRole([Role.ADMIN]));

notificationRouter.post('/recalculate', recalculateStatuses);
notificationRouter.post('/digest', triggerDigest);
