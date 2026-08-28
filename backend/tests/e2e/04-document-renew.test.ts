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

describe('TC-E2E-04: Renovacao e DocumentVersion imutavel (RF-004 / RN-002)', () => {
  const req = getRequest();

  it('arquiva a versao anterior e mantem o documento vigente renovado', async () => {
    const { adminToken, operationalToken } = await getAuthTokens();
    const categoryId = await getCategoryId(adminToken);
    const title = uniqueValue('contrato-renovavel');

    const created = await req
      .post(getApiPath('/api/v1/documents'))
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', title)
      .field('categoryId', categoryId)
      .field('issueDate', isoDateFromNow(-365))
      .field('expirationDate', isoDateFromNow(30))
      .attach('attachment', minimalPdfPath, {
        filename: 'contrato-v1.pdf',
        contentType: 'application/pdf',
      });
    expect(created.status).toBe(201);
    const documentId = created.body.document.id as string;

    const renewed = await req
      .post(getApiPath(`/api/v1/documents/${documentId}/renew`))
      .set('Authorization', `Bearer ${operationalToken}`)
      .field('issueDate', isoDateFromNow(0))
      .field('expirationDate', isoDateFromNow(365))
      .field('notes', 'Renovado pelo TC-04.')
      .attach('attachment', minimalPdfPath, {
        filename: 'contrato-v2.pdf',
        contentType: 'application/pdf',
      });

    expect(renewed.status).toBe(200);
    expect(renewed.body.previousVersionNumber).toBe(1);
    expect(renewed.body.document.attachmentFilename).toBe('contrato-v2.pdf');

    const versions = await req
      .get(getApiPath(`/api/v1/documents/${documentId}/versions`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(versions.status).toBe(200);
    expect(versions.body.versions).toHaveLength(1);
    expect(versions.body.versions[0]).toMatchObject({
      versionNumber: 1,
      attachmentFilename: 'contrato-v1.pdf',
    });

    const current = await req
      .get(getApiPath(`/api/v1/documents/${documentId}`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(current.body.document.versions).toHaveLength(1);
    expect(current.body.document.attachmentFilename).toBe('contrato-v2.pdf');
  });
});
