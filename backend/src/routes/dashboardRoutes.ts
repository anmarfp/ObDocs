import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { getMetrics } from '../controllers/dashboardController.js';

export const dashboardRouter = Router();

// Todas as rotas de dashboard exigem autenticação prévia
dashboardRouter.use(authMiddleware);

// Métricas consolidadas do dashboard (RF-007)
dashboardRouter.get('/metrics', getMetrics);
