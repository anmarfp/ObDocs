import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware, requireRole } from '../middlewares/auth.js';
import { upload } from '../services/storageService.js';
import {
  createDocument,
  listDocuments,
  getDocumentById,
  updateDocument,
  toggleArchive,
  deleteDocument,
} from '../controllers/documentController.js';

export const documentRouter = Router();

// Todas as rotas de documentos exigem autenticação prévia
documentRouter.use(authMiddleware);

// 1. Criação de documento (com upload opcional de anexo)
documentRouter.post('/', upload.single('attachment'), createDocument);

// 2. Listagem de documentos com filtros (categoria, status, busca e arquivados)
documentRouter.get('/', listDocuments);

// 3. Detalhes de um documento específico por ID
documentRouter.get('/:id', getDocumentById);

// 4. Atualização de documento (com upload opcional de novo anexo)
documentRouter.put('/:id', upload.single('attachment'), updateDocument);

// 5. Alternar status de arquivamento (Soft Delete / Unarchive)
documentRouter.patch('/:id/archive', toggleArchive);

// 6. Exclusão permanente do documento (Hard Delete restrito a Administradores)
documentRouter.delete('/:id', requireRole([Role.ADMIN]), deleteDocument);
