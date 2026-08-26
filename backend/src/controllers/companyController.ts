import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { NotificationMode } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

const updateCompanyConfigSchema = z.object({
  notificationMode: z.nativeEnum(NotificationMode, {
    errorMap: () => ({ message: 'Modo de notificação inválido (ALL_ADMINS ou ONLY_RESPONSIBLE).' }),
  }),
});

export async function getCompanyConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let config = await prisma.companyConfig.findFirst({
      include: {
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!config) {
      config = await prisma.companyConfig.create({
        data: {
          notificationMode: NotificationMode.ALL_ADMINS,
        },
        include: {
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    res.status(200).json({ config });
  } catch (error) {
    next(error);
  }
}

export async function updateCompanyConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { notificationMode } = updateCompanyConfigSchema.parse(req.body);

    const existingConfig = await prisma.companyConfig.findFirst();

    let updatedConfig;
    if (existingConfig) {
      updatedConfig = await prisma.companyConfig.update({
        where: { id: existingConfig.id },
        data: {
          notificationMode,
          updatedById: req.user?.userId,
        },
        include: {
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      updatedConfig = await prisma.companyConfig.create({
        data: {
          notificationMode,
          updatedById: req.user?.userId,
        },
        include: {
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    res.status(200).json({
      message: 'Configuração da empresa atualizada com sucesso.',
      config: updatedConfig,
    });
  } catch (error) {
    next(error);
  }
}
