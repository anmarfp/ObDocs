import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { listAuditLogs, getAuditLogById } from '../controllers/auditController.js';

export const auditRouter = Router();

// Todas as rotas da trilha de auditoria exigem autenticação e perfil ADMIN (RF-013 / RBAC)
auditRouter.use(authMiddleware);
auditRouter.use(requireRole([Role.ADMIN]));

auditRouter.get('/', listAuditLogs);
auditRouter.get('/:id', getAuditLogById);
