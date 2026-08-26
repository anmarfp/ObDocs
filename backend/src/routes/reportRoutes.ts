import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { exportReport, getSummary } from '../controllers/reportController.js';

export const reportRouter = Router();

// Todas as rotas de relatórios exigem autenticação prévia
reportRouter.use(authMiddleware);

// Exportação de documentos (CSV por padrão ou JSON)
reportRouter.get('/export', exportReport);

// Resumo executivo consolidado com totais e conformidade
reportRouter.get('/summary', getSummary);
