import { describe, it, expect } from 'vitest';
import {
  getRequest,
  getApiPath,
  getAuthTokens,
  getCategoryId,
  isoDateFromNow,
  minimalPdfPath,
  uniqueValue,
} from './helpers/auth.helper.js';

describe('TC-E2E-03: CRUD de documentos, upload, MIME e tamanho (RF-001 / RF-002)', () => {
  const req = getRequest();

  it('executa create, list, read, update, download autenticado e delete', async () => {
    const { adminToken } = await getAuthTokens();
    const categoryId = await getCategoryId(adminToken);
    const originalTitle = uniqueValue('documento-crud');
    const updatedTitle = `${originalTitle}-atualizado`;

    const created = await req
      .post(getApiPath('/api/v1/documents'))
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', originalTitle)
      .field('categoryId', categoryId)
      .field('issueDate', isoDateFromNow(-10))
      .field('expirationDate', isoDateFromNow(90))
      .field('alertLeadDays', '30')
      .attach('attachment', minimalPdfPath, {
        filename: 'licenca-e2e.pdf',
        contentType: 'application/pdf',
      });

    expect(created.status).toBe(201);
    expect(created.body.document).toMatchObject({
      title: originalTitle,
      status: 'REGULAR',
      attachmentFilename: 'licenca-e2e.pdf',
      fileMimeType: 'application/pdf',
    });
    const documentId = created.body.document.id as string;
    const attachmentUrl = created.body.document.attachmentUrl as string;

    const listed = await req
      .get(getApiPath(`/api/v1/documents?search=${encodeURIComponent(originalTitle)}`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.documents.some((document: any) => document.id === documentId)).toBe(true);

    const detailed = await req
      .get(getApiPath(`/api/v1/documents/${documentId}`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detailed.status).toBe(200);
    expect(detailed.body.document.category.id).toBe(categoryId);

    const downloaded = await req
      .get(getApiPath(attachmentUrl))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers['content-type']).toContain('application/pdf');
    expect(downloaded.body.length).toBeGreaterThan(20);

    const updated = await req
      .put(getApiPath(`/api/v1/documents/${documentId}`))
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', updatedTitle);
    expect(updated.status).toBe(200);
    expect(updated.body.document.title).toBe(updatedTitle);

    const deleted = await req
      .delete(getApiPath(`/api/v1/documents/${documentId}`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);

    const missing = await req
      .get(getApiPath(`/api/v1/documents/${documentId}`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(missing.status).toBe(404);
  });

  it('rejeita MIME nao permitido', async () => {
    const { adminToken } = await getAuthTokens();
    const categoryId = await getCategoryId(adminToken);
    const response = await req
      .post(getApiPath('/api/v1/documents'))
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', uniqueValue('mime-invalido'))
      .field('categoryId', categoryId)
      .field('issueDate', isoDateFromNow(-1))
      .attach('attachment', Buffer.from('arquivo de texto proibido'), {
        filename: 'proibido.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('INVALID_FILE_TYPE');
  });

  it('rejeita anexo acima de 10 MiB', async () => {
    const { adminToken } = await getAuthTokens();
    const categoryId = await getCategoryId(adminToken);
    const response = await req
      .post(getApiPath('/api/v1/documents'))
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', uniqueValue('arquivo-grande'))
      .field('categoryId', categoryId)
      .field('issueDate', isoDateFromNow(-1))
      .attach('attachment', Buffer.alloc(10 * 1024 * 1024 + 1, 0x20), {
        filename: 'grande.pdf',
        contentType: 'application/pdf',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('FILE_TOO_LARGE');
  });
});
