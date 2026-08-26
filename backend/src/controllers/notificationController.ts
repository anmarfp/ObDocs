import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { recalculateAllStatuses, runDailyDigestJob } from '../services/cronService.js';

/**
 * Dispara o recálculo imediato de status e envio de alertas (Endpoint administrativo / cron webhook).
 */
export async function recalculateStatuses(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await recalculateAllStatuses();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Dispara o Daily Digest imediatamente para os administradores ativos.
 */
export async function triggerDigest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await runDailyDigestJob();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
