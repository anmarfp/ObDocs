import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { DocumentStatus, Role, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { generateDocumentsCsv, generateSummaryReport } from '../services/reportService.js';

const reportQuerySchema = z.object({
  format: z.enum(['csv', 'json']).default('csv').optional(),
  status: z.nativeEnum(DocumentStatus).optional(),
  categoryId: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'startDate inválida.' }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'endDate inválida.' }),
  includeArchived: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === 'true'),
});

function buildReportWhere(userRole: Role, query: z.infer<typeof reportQuerySchema>): Prisma.DocumentWhereInput {
  const where: Prisma.DocumentWhereInput = {};

  // Regra RBAC: Apenas ADMIN com includeArchived=true pode visualizar arquivados
  if (userRole === Role.ADMIN && query.includeArchived) {
    // Exibe todos (ativos e arquivados)
  } else {
    where.isArchived = false;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  if (query.startDate || query.endDate) {
    where.expirationDate = {
      ...(query.startDate && { gte: new Date(query.startDate) }),
      ...(query.endDate && { lte: new Date(query.endDate) }),
    };
  }

  return where;
}

/**
 * Exporta relatórios de documentos em formato CSV ou JSON com suporte a filtros e controle RBAC (RF-007).
 */
export async function exportReport(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const query = reportQuerySchema.parse(req.query);
    const where = buildReportWhere(req.user.role, query);

    const documents = await prisma.document.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (query.format === 'json') {
      res.status(200).json({
        documents,
        total: documents.length,
      });
      return;
    }

    const csv = generateDocumentsCsv(documents);
    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-documentos-${dateStr}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}

/**
 * Retorna o resumo executivo dos documentos para tomada de decisão (RF-007).
 */
export async function getSummary(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const query = reportQuerySchema.parse(req.query);
    const where = buildReportWhere(req.user.role, query);

    const documents = await prisma.document.findMany({
      where,
      include: {
        category: true,
      },
    });

    const summary = generateSummaryReport(documents);
    res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
}
