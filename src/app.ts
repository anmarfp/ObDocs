import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

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
    service: 'docsob-backend',
  });
});

// Rotas da API
app.use('/api/v1/auth', authRouter);

// Middleware Central de Erros
app.use(errorHandler);
