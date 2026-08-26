import { Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

const createUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail em formato inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Papel de usuário inválido (ADMIN ou OPERATIONAL).' }) }).default(Role.OPERATIONAL),
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional(),
  email: z.string().email('E-mail em formato inválido.').optional(),
  role: z.nativeEnum(Role).optional(),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
});

export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const sanitized = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    res.status(200).json({ users: sanitized });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      res.status(409).json({
        error: 'EMAIL_ALREADY_EXISTS',
        message: 'Já existe um usuário cadastrado com este e-mail.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash,
        role: data.role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = updateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
      return;
    }

    if (data.email && data.email.toLowerCase() !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (emailTaken) {
        res.status(409).json({
          error: 'EMAIL_ALREADY_EXISTS',
          message: 'Este e-mail já está sendo utilizado por outro usuário.',
        });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.email && { email: data.email.toLowerCase().trim() }),
        ...(data.role && { role: data.role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      message: 'Usuário atualizado com sucesso.',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (req.user?.userId === id) {
      res.status(400).json({
        error: 'CANNOT_DEACTIVATE_SELF',
        message: 'Você não pode inativar seu próprio usuário administrador.',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      message: `Usuário ${updatedUser.isActive ? 'ativado' : 'inativado'} com sucesso.`,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { password } = updatePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.status(200).json({
      message: 'Senha do usuário redefinida com sucesso.',
    });
  } catch (error) {
    next(error);
  }
}
