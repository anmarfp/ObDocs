import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

const createCategorySchema = z.object({
  name: z.string().min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.'),
  colorHex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida (formato hex #RGB ou #RRGGBB).').optional(),
  description: z.string().optional(),
});

export async function listCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await prisma.documentCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        documents: {
          select: { id: true },
        },
      },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      colorHex: cat.colorHex,
      description: cat.description,
      createdAt: cat.createdAt,
      documentCount: cat.documents.length,
    }));

    res.status(200).json({ categories: formatted });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createCategorySchema.parse(req.body);

    const existing = await prisma.documentCategory.findUnique({
      where: { name: data.name.trim() },
    });

    if (existing) {
      res.status(409).json({
        error: 'CATEGORY_ALREADY_EXISTS',
        message: 'Já existe uma categoria cadastrada com este nome.',
      });
      return;
    }

    const newCategory = await prisma.documentCategory.create({
      data: {
        name: data.name.trim(),
        colorHex: data.colorHex || '#3b82f6',
        description: data.description?.trim(),
      },
    });

    res.status(201).json({
      message: 'Categoria criada com sucesso.',
      category: newCategory,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const category = await prisma.documentCategory.findUnique({
      where: { id },
      include: {
        documents: {
          select: { id: true },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        error: 'CATEGORY_NOT_FOUND',
        message: 'Categoria não encontrada.',
      });
      return;
    }

    if (category.documents.length > 0) {
      res.status(400).json({
        error: 'CATEGORY_IN_USE',
        message: `Não é possível excluir esta categoria pois ela possui ${category.documents.length} documento(s) associado(s).`,
      });
      return;
    }

    await prisma.documentCategory.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Categoria excluída com sucesso.',
    });
  } catch (error) {
    next(error);
  }
}
