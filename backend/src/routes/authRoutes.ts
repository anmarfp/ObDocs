import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

export const authRouter = Router();

authRouter.post('/login', login);
authRouter.get('/me', authMiddleware, getMe);
