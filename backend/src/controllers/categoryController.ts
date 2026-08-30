import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';

export const DEFAULT_CATEGORY_NAME = 'Sem Categoria';

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
    const trimmedName = data.name.trim();

    if (trimmedName === DEFAULT_CATEGORY_NAME) {
      res.status(400).json({
        error: 'RESERVED_CATEGORY_NAME',
        message: 'Este nome é reservado para a categoria padrão do sistema.',
      });
      return;
    }

    const existing = await prisma.documentCategory.findUnique({
      where: { name: trimmedName },
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
        name: trimmedName,
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

export async function updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = createCategorySchema.parse(req.body);
    const trimmedName = data.name.trim();

    const category = await prisma.documentCategory.findUnique({ where: { id } });

    if (!category) {
      res.status(404).json({
        error: 'CATEGORY_NOT_FOUND',
        message: 'Categoria não encontrada.',
      });
      return;
    }

    if (category.name === DEFAULT_CATEGORY_NAME) {
      res.status(400).json({
        error: 'DEFAULT_CATEGORY_PROTECTED',
        message: 'A categoria padrão "Sem Categoria" não pode ser editada.',
      });
      return;
    }

    if (trimmedName === DEFAULT_CATEGORY_NAME) {
      res.status(400).json({
        error: 'RESERVED_CATEGORY_NAME',
        message: 'Este nome é reservado para a categoria padrão do sistema.',
      });
      return;
    }

    if (trimmedName !== category.name) {
      const existing = await prisma.documentCategory.findUnique({ where: { name: trimmedName } });
      if (existing) {
        res.status(409).json({
          error: 'CATEGORY_ALREADY_EXISTS',
          message: 'Já existe uma categoria cadastrada com este nome.',
        });
        return;
      }
    }

    const updated = await prisma.documentCategory.update({
      where: { id },
      data: {
        name: trimmedName,
        colorHex: data.colorHex || category.colorHex,
        description: data.description?.trim(),
      },
    });

    res.status(200).json({
      message: 'Categoria atualizada com sucesso.',
      category: updated,
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

    if (category.name === DEFAULT_CATEGORY_NAME) {
      res.status(400).json({
        error: 'DEFAULT_CATEGORY_PROTECTED',
        message: 'A categoria padrão "Sem Categoria" não pode ser excluída.',
      });
      return;
    }

    if (category.documents.length > 0) {
      const defaultCategory = await prisma.documentCategory.findUnique({
        where: { name: DEFAULT_CATEGORY_NAME },
      });

      if (!defaultCategory) {
        res.status(500).json({
          error: 'DEFAULT_CATEGORY_MISSING',
          message: 'Categoria padrão "Sem Categoria" não encontrada. Não é possível reatribuir os documentos associados.',
        });
        return;
      }

      await prisma.$transaction([
        prisma.document.updateMany({
          where: { categoryId: id },
          data: { categoryId: defaultCategory.id },
        }),
        prisma.documentCategory.delete({ where: { id } }),
      ]);

      res.status(200).json({
        message: `Categoria excluída. ${category.documents.length} documento(s) reclassificado(s) como "${DEFAULT_CATEGORY_NAME}".`,
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
