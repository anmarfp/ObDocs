import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role, DocumentStatus, AuditAction, NotificationMode, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../types/index.js';
import { calculateDocumentStatus } from '../services/statusService.js';
import { deleteUploadedFile } from '../services/storageService.js';

// Schema de validação para criação de documento
const createDocumentSchema = z.object({
  title: z
    .string({ required_error: 'O título do documento é obrigatório.' })
    .trim()
    .min(1, 'O título não pode estar em branco.')
    .max(200, 'O título pode ter no máximo 200 caracteres.'),
  categoryId: z
    .string({ required_error: 'A categoria do documento é obrigatória.' })
    .uuid('ID da categoria inválido.'),
  issuingBody: z
    .string()
    .trim()
    .max(150, 'O órgão emissor pode ter no máximo 150 caracteres.')
    .optional()
    .nullable()
    .transform((val) => (!val || val.trim() === '' ? null : val.trim())),
  issueDate: z
    .string({ required_error: 'A data de emissão é obrigatória.' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Data de emissão inválida.',
    }),
  expirationDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val.trim() === '' ? null : val.trim()))
    .refine((val) => val === null || !isNaN(Date.parse(val)), {
      message: 'Data de vencimento inválida.',
    }),
  alertLeadDays: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null || val === '') return 30;
      const num = Number(val);
      return isNaN(num) ? 30 : num;
    })
    .pipe(z.number().int('Antecedência deve ser um número inteiro.').min(1, 'A antecedência mínima de alerta é de 1 dia.')),
  responsibleName: z
    .string()
    .trim()
    .max(150, 'Nome do responsável pode ter no máximo 150 caracteres.')
    .optional()
    .nullable()
    .transform((val) => (!val || val.trim() === '' ? null : val.trim())),
  responsibleEmail: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (!val || val.trim() === '' ? null : val.trim()))
    .pipe(z.string().email('E-mail do responsável em formato inválido.').nullable().optional()),
  notes: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (!val || val.trim() === '' ? null : val.trim())),
  isRenewalInProgress: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => val === true || val === 'true'),
});

// Schema de validação para atualização de documento
const updateDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'O título não pode estar em branco.')
    .max(200, 'O título pode ter no máximo 200 caracteres.')
    .optional(),
  categoryId: z.string().uuid('ID da categoria inválido.').optional(),
  issuingBody: z
    .string()
    .trim()
    .max(150, 'O órgão emissor pode ter no máximo 150 caracteres.')
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : !val || val.trim() === '' ? null : val.trim())),
  issueDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Data de emissão inválida.',
    }),
  expirationDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : !val || val.trim() === '' ? null : val.trim()))
    .refine((val) => val === undefined || val === null || !isNaN(Date.parse(val)), {
      message: 'Data de vencimento inválida.',
    }),
  alertLeadDays: z
    .union([z.number(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (val === null || val === '') return 30;
      const num = Number(val);
      return isNaN(num) ? 30 : num;
    })
    .pipe(z.number().int('Antecedência deve ser um número inteiro.').min(1, 'A antecedência mínima de alerta é de 1 dia.').optional()),
  responsibleName: z
    .string()
    .trim()
    .max(150, 'Nome do responsável pode ter no máximo 150 caracteres.')
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : !val || val.trim() === '' ? null : val.trim())),
  responsibleEmail: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : !val || val.trim() === '' ? null : val.trim()))
    .pipe(z.string().email('E-mail do responsável em formato inválido.').nullable().optional()),
  notes: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === undefined ? undefined : !val || val.trim() === '' ? null : val.trim())),
  status: z.nativeEnum(DocumentStatus).optional(),
  isRenewalInProgress: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === true || val === 'true')),
});

/**
 * Cria um novo documento no sistema.
 */
export async function createDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      if (req.file) await deleteUploadedFile(req.file.filename);
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const parsed = createDocumentSchema.parse(req.body);

    // Validação da regra RN-004: Condicional de Responsável x Configuração da Empresa
    const companyConfig = await prisma.companyConfig.findFirst();
    if (companyConfig?.notificationMode === NotificationMode.ONLY_RESPONSIBLE) {
      if (!parsed.responsibleName || !parsed.responsibleEmail) {
        if (req.file) await deleteUploadedFile(req.file.filename);
        res.status(400).json({
          error: 'RESPONSIBLE_REQUIRED',
          message:
            'O nome e o e-mail do responsável são obrigatórios quando a empresa está configurada no modo "Apenas Responsável".',
        });
        return;
      }
    }

    // Validação de existência da categoria
    const category = await prisma.documentCategory.findUnique({
      where: { id: parsed.categoryId },
    });

    if (!category) {
      if (req.file) await deleteUploadedFile(req.file.filename);
      res.status(404).json({
        error: 'CATEGORY_NOT_FOUND',
        message: 'Categoria de documento não encontrada.',
      });
      return;
    }

    // Cálculo do status visual inicial com base na matriz de cores (RN-001)
    const expirationDate = parsed.expirationDate ? new Date(parsed.expirationDate) : null;
    const initialStatus = calculateDocumentStatus(
      expirationDate,
      parsed.alertLeadDays,
      parsed.isRenewalInProgress
    );

    // Persistência do documento
    const document = await prisma.document.create({
      data: {
        title: parsed.title,
        categoryId: parsed.categoryId,
        issuingBody: parsed.issuingBody || null,
        issueDate: new Date(parsed.issueDate),
        expirationDate,
        alertLeadDays: parsed.alertLeadDays,
        status: initialStatus,
        responsibleName: parsed.responsibleName || null,
        responsibleEmail: parsed.responsibleEmail || null,
        notes: parsed.notes || null,
        attachmentUrl: req.file ? `/api/v1/uploads/${req.file.filename}` : null,
        attachmentFilename: req.file ? req.file.originalname : null,
        fileSizeBytes: req.file ? req.file.size : null,
        fileMimeType: req.file ? req.file.mimetype : null,
        isArchived: false,
        createdById: req.user.userId,
      },
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Trilha de auditoria (RN-008)
    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        userId: req.user.userId,
        userName: req.user.name,
        action: AuditAction.CREATE,
        diffData: {
          title: { new: document.title },
          categoryId: { new: document.categoryId },
          issueDate: { new: document.issueDate },
          expirationDate: { new: document.expirationDate },
          status: { new: document.status },
          alertLeadDays: { new: document.alertLeadDays },
          attachmentFilename: { new: document.attachmentFilename },
        },
      },
    });

    res.status(201).json({
      message: 'Documento cadastrado com sucesso.',
      document,
    });
  } catch (error) {
    if (req.file) {
      await deleteUploadedFile(req.file.filename);
    }
    next(error);
  }
}

/**
 * Lista os documentos cadastrados com filtros e controle de visibilidade RBAC.
 */
export async function listDocuments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const { categoryId, status, search, includeArchived } = req.query;

    const where: Prisma.DocumentWhereInput = {};

    // Regra RBAC para documentos arquivados:
    // Apenas ADMIN com includeArchived=true pode visualizar documentos arquivados.
    // Usuários OPERATIONAL NUNCA visualizam documentos arquivados.
    const isAdmin = req.user.role === Role.ADMIN;
    const wantsArchived = includeArchived === 'true';

    if (isAdmin && wantsArchived) {
      // Se for admin e pediu arquivados, exibe todos
    } else {
      where.isArchived = false;
    }

    if (categoryId && typeof categoryId === 'string') {
      where.categoryId = categoryId;
    }

    if (status && typeof status === 'string') {
      if (Object.values(DocumentStatus).includes(status as DocumentStatus)) {
        where.status = status as DocumentStatus;
      }
    }

    if (search && typeof search === 'string') {
      const query = search.trim();
      if (query.length > 0) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { issuingBody: { contains: query, mode: 'insensitive' } },
          { responsibleName: { contains: query, mode: 'insensitive' } },
          { notes: { contains: query, mode: 'insensitive' } },
        ];
      }
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          category: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
          _count: {
            select: { versions: true, auditLogs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.count({ where }),
    ]);

    res.status(200).json({
      documents,
      total,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém detalhes completos de um documento por ID.
 */
export async function getDocumentById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        versions: {
          include: {
            renewedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { versionNumber: 'desc' },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
        gcalSyncLogs: {
          orderBy: { lastSyncedAt: 'desc' },
        },
      },
    });

    if (!document) {
      res.status(404).json({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      });
      return;
    }

    // Se estiver arquivado e o usuário for OPERATIONAL, retorna 404 (oculto)
    if (document.isArchived && req.user.role === Role.OPERATIONAL) {
      res.status(404).json({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      });
      return;
    }

    res.status(200).json({ document });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza os dados de um documento e recalcula seu status visual.
 */
export async function updateDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      if (req.file) await deleteUploadedFile(req.file.filename);
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const existingDoc = await prisma.document.findUnique({
      where: { id },
    });

    if (!existingDoc) {
      if (req.file) await deleteUploadedFile(req.file.filename);
      res.status(404).json({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      });
      return;
    }

    // Bloqueia acesso operacional a documentos arquivados
    if (existingDoc.isArchived && req.user.role === Role.OPERATIONAL) {
      if (req.file) await deleteUploadedFile(req.file.filename);
      res.status(404).json({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      });
      return;
    }

    const parsed = updateDocumentSchema.parse(req.body);

    // Se a categoria for alterada, valida existência
    if (parsed.categoryId && parsed.categoryId !== existingDoc.categoryId) {
      const category = await prisma.documentCategory.findUnique({
        where: { id: parsed.categoryId },
      });
      if (!category) {
        if (req.file) await deleteUploadedFile(req.file.filename);
        res.status(404).json({
          error: 'CATEGORY_NOT_FOUND',
          message: 'Categoria de documento não encontrada.',
        });
        return;
      }
    }

    // Valida regra RN-004 se alterando responsável
    const companyConfig = await prisma.companyConfig.findFirst();
    if (companyConfig?.notificationMode === NotificationMode.ONLY_RESPONSIBLE) {
      const finalRespName =
        parsed.responsibleName !== undefined ? parsed.responsibleName : existingDoc.responsibleName;
      const finalRespEmail =
        parsed.responsibleEmail !== undefined ? parsed.responsibleEmail : existingDoc.responsibleEmail;

      if (!finalRespName || !finalRespEmail) {
        if (req.file) await deleteUploadedFile(req.file.filename);
        res.status(400).json({
          error: 'RESPONSIBLE_REQUIRED',
          message:
            'O nome e o e-mail do responsável são obrigatórios quando a empresa está configurada no modo "Apenas Responsável".',
        });
        return;
      }
    }

    // Determina nova data de expiração e prazo de alerta
    const finalExpirationDate =
      parsed.expirationDate !== undefined
        ? parsed.expirationDate
          ? new Date(parsed.expirationDate)
          : null
        : existingDoc.expirationDate;

    const finalAlertLeadDays =
      parsed.alertLeadDays !== undefined ? parsed.alertLeadDays : existingDoc.alertLeadDays;

    const isRenewal =
      parsed.isRenewalInProgress !== undefined
        ? parsed.isRenewalInProgress
        : existingDoc.status === DocumentStatus.RENEWAL_IN_PROGRESS;

    const newStatus =
      parsed.status && parsed.status === DocumentStatus.RENEWAL_IN_PROGRESS
        ? DocumentStatus.RENEWAL_IN_PROGRESS
        : calculateDocumentStatus(finalExpirationDate, finalAlertLeadDays, isRenewal);

    // Mapeia diferenças para o Audit Log (RN-008)
    const diffData: Record<string, { old: any; new: any }> = {};

    if (parsed.title !== undefined && parsed.title !== existingDoc.title) {
      diffData.title = { old: existingDoc.title, new: parsed.title };
    }
    if (parsed.categoryId !== undefined && parsed.categoryId !== existingDoc.categoryId) {
      diffData.categoryId = { old: existingDoc.categoryId, new: parsed.categoryId };
    }
    if (parsed.issuingBody !== undefined && parsed.issuingBody !== existingDoc.issuingBody) {
      diffData.issuingBody = { old: existingDoc.issuingBody, new: parsed.issuingBody };
    }
    if (parsed.issueDate !== undefined) {
      const oldIssueIso = existingDoc.issueDate.toISOString().split('T')[0];
      const newIssueIso = new Date(parsed.issueDate).toISOString().split('T')[0];
      if (oldIssueIso !== newIssueIso) {
        diffData.issueDate = { old: existingDoc.issueDate, new: new Date(parsed.issueDate) };
      }
    }
    if (parsed.expirationDate !== undefined) {
      const oldExpIso = existingDoc.expirationDate ? existingDoc.expirationDate.toISOString().split('T')[0] : null;
      const newExpIso = finalExpirationDate ? finalExpirationDate.toISOString().split('T')[0] : null;
      if (oldExpIso !== newExpIso) {
        diffData.expirationDate = { old: existingDoc.expirationDate, new: finalExpirationDate };
      }
    }
    if (parsed.alertLeadDays !== undefined && parsed.alertLeadDays !== existingDoc.alertLeadDays) {
      diffData.alertLeadDays = { old: existingDoc.alertLeadDays, new: parsed.alertLeadDays };
    }
    if (newStatus !== existingDoc.status) {
      diffData.status = { old: existingDoc.status, new: newStatus };
    }
    if (parsed.responsibleName !== undefined && parsed.responsibleName !== existingDoc.responsibleName) {
      diffData.responsibleName = { old: existingDoc.responsibleName, new: parsed.responsibleName };
    }
    if (parsed.responsibleEmail !== undefined && parsed.responsibleEmail !== existingDoc.responsibleEmail) {
      diffData.responsibleEmail = { old: existingDoc.responsibleEmail, new: parsed.responsibleEmail };
    }
    if (parsed.notes !== undefined && parsed.notes !== existingDoc.notes) {
      diffData.notes = { old: existingDoc.notes, new: parsed.notes };
    }
    if (req.file) {
      diffData.attachmentFilename = { old: existingDoc.attachmentFilename, new: req.file.originalname };
      // Remove anexo anterior do disco se substituído
      if (existingDoc.attachmentUrl) {
        await deleteUploadedFile(existingDoc.attachmentUrl);
      }
    }

    // Atualiza documento
    const updatedDocument = await prisma.document.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.categoryId !== undefined && { categoryId: parsed.categoryId }),
        ...(parsed.issuingBody !== undefined && { issuingBody: parsed.issuingBody }),
        ...(parsed.issueDate !== undefined && { issueDate: new Date(parsed.issueDate) }),
        ...(parsed.expirationDate !== undefined && { expirationDate: finalExpirationDate }),
        ...(parsed.alertLeadDays !== undefined && { alertLeadDays: parsed.alertLeadDays }),
        status: newStatus,
        ...(parsed.responsibleName !== undefined && { responsibleName: parsed.responsibleName }),
        ...(parsed.responsibleEmail !== undefined && { responsibleEmail: parsed.responsibleEmail }),
        ...(parsed.notes !== undefined && { notes: parsed.notes }),
        ...(req.file && {
          attachmentUrl: `/api/v1/uploads/${req.file.filename}`,
          attachmentFilename: req.file.originalname,
          fileSizeBytes: req.file.size,
          fileMimeType: req.file.mimetype,
        }),
      },
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Registra auditoria caso tenha havido alterações
    if (Object.keys(diffData).length > 0) {
      await prisma.auditLog.create({
        data: {
          documentId: updatedDocument.id,
          userId: req.user.userId,
          userName: req.user.name,
          action: AuditAction.UPDATE,
          diffData,
        },
      });
    }

    res.status(200).json({
      message: 'Documento atualizado com sucesso.',
      document: updatedDocument,
    });
  } catch (error) {
    if (req.file) {
      await deleteUploadedFile(req.file.filename);
    }
    next(error);
  }
}

/**
 * Alterna o estado de arquivamento de um documento (Soft Delete / Desarquivamento).
 */
export async function toggleArchive(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      });
      return;
    }

    // Se estiver arquivado e usuário for OPERATIONAL, não permite localizar/desarquivar
    if (document.isArchived && req.user.role === Role.OPERATIONAL) {
      res.status(404).json({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      });
      return;
    }

    const newIsArchived = !document.isArchived;
    const action = newIsArchived ? AuditAction.ARCHIVE : AuditAction.UNARCHIVE;

    const updatedDocument = await prisma.document.update({
      where: { id },
      data: { isArchived: newIsArchived },
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Registra ação de auditoria
    await prisma.auditLog.create({
      data: {
        documentId: document.id,
        userId: req.user.userId,
        userName: req.user.name,
        action,
        diffData: {
          isArchived: { old: document.isArchived, new: newIsArchived },
        },
      },
    });

    res.status(200).json({
      message: newIsArchived ? 'Documento arquivado com sucesso.' : 'Documento desarquivado com sucesso.',
      document: updatedDocument,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Exclui permanentemente um documento e seu anexo físico do storage (Hard Delete - Apenas Admin).
 */
export async function deleteDocument(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuário não autenticado.' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      res.status(404).json({
        error: 'DOCUMENT_NOT_FOUND',
        message: 'Documento não encontrado.',
      });
      return;
    }

    // Se possuir anexo físico salvo, remove do disco
    if (document.attachmentUrl) {
      await deleteUploadedFile(document.attachmentUrl);
    }

    // Registra o log de auditoria de exclusão permanente antes de deletar
    await prisma.auditLog.create({
      data: {
        documentId: null,
        userId: req.user.userId,
        userName: req.user.name,
        action: AuditAction.DELETE,
        diffData: {
          deletedDocumentId: { old: document.id },
          title: { old: document.title },
        },
      },
    });

    // Hard delete no banco de dados (cascateia versions e gcal logs)
    await prisma.document.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Documento excluído permanentemente com sucesso.',
    });
  } catch (error) {
    next(error);
  }
}
