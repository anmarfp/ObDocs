import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import {
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
} from '../controllers/userController.js';

export const userRouter = Router();

// Todas as rotas de usuários exigem autenticação e perfil ADMIN
userRouter.use(authMiddleware);
userRouter.use(requireRole([Role.ADMIN]));

userRouter.get('/', listUsers);
userRouter.post('/', createUser);
userRouter.put('/:id', updateUser);
userRouter.patch('/:id/status', toggleUserStatus);
userRouter.patch('/:id/password', resetUserPassword);
