import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';

export const categoryRouter = Router();

// Todas as rotas de categoria exigem autenticação
categoryRouter.use(authMiddleware);

// Listagem pública para usuários autenticados
categoryRouter.get('/', listCategories);

// Criação, edição e exclusão restritas a Administradores
categoryRouter.post('/', requireRole([Role.ADMIN]), createCategory);
categoryRouter.put('/:id', requireRole([Role.ADMIN]), updateCategory);
categoryRouter.delete('/:id', requireRole([Role.ADMIN]), deleteCategory);
