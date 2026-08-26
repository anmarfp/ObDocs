import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { getCompanyConfig, updateCompanyConfig } from '../controllers/companyController.js';

export const companyRouter = Router();

// Leitura de configuração liberada para todos os usuários autenticados (para renderizar forms)
companyRouter.get('/config', authMiddleware, getCompanyConfig);

// Alteração de configuração restrita a Administradores
companyRouter.put('/config', authMiddleware, requireRole([Role.ADMIN]), updateCompanyConfig);
