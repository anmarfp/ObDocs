import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { getDashboardMetrics } from '../services/dashboardService.js';

/**
 * Retorna as métricas consolidadas do dashboard (RF-007).
 */
export async function getMetrics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const metrics = await getDashboardMetrics(req.user.role);
    res.status(200).json(metrics);
  } catch (error) {
    next(error);
  }
}
