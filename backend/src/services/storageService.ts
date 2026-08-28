import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Respeita UPLOAD_DIR via variável de ambiente ou usa ./uploads local
export const UPLOADS_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(process.cwd(), 'uploads');

// Respeita MAX_FILE_SIZE_BYTES via variável de ambiente (padrão 10 MB = 10.485.760 bytes)
export const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE_BYTES
  ? parseInt(process.env.MAX_FILE_SIZE_BYTES, 10) || 10 * 1024 * 1024
  : 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
];

// Garante que o diretório de uploads exista no filesystem
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueHash = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uniqueHash}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const mime = file.mimetype.toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(mime)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de arquivo não permitido: "${file.mimetype}". Formatos aceitos: PDF, PNG, JPEG, JPG.`
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Remove com segurança um arquivo anexo do disco local.
 */
export async function deleteUploadedFile(fileUrlOrFilename: string | null | undefined): Promise<boolean> {
  if (!fileUrlOrFilename) return false;

  try {
    const filename = path.basename(fileUrlOrFilename);
    const fullPath = path.resolve(UPLOADS_DIR, filename);

    // Proteção contra Directory Traversal
    if (!fullPath.startsWith(UPLOADS_DIR)) {
      console.warn('⚠️ [Storage] Tentativa de exclusão de arquivo fora do diretório de uploads:', fileUrlOrFilename);
      return false;
    }

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('⚠️ [Storage] Erro ao excluir arquivo anexo:', error);
    return false;
  }
}
