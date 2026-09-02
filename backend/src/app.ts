import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes.js';
import { documentRouter } from './routes/documentRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { companyRouter } from './routes/companyRoutes.js';
import { categoryRouter } from './routes/categoryRoutes.js';
import { auditRouter } from './routes/auditRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { calendarRouter } from './routes/calendarRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { authMiddleware } from './middlewares/auth.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { UPLOADS_DIR } from './services/storageService.js';

export const app = express();

// Middlewares Globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'docsobs-backend',
  });
});

// Armazenamento de Arquivos Estáticos Protegido por Autenticação
app.use('/api/v1/uploads', authMiddleware, express.static(UPLOADS_DIR));

// Rotas da API
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/documents', documentRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/company', companyRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/audit-logs', auditRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/reports', reportRouter);

// Middleware Central de Erros
app.use(errorHandler);
