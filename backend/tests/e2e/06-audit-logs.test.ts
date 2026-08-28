import { describe, it, expect } from 'vitest';
import {
  getRequest,
  getApiPath,
  getAuthTokens,
  getCategoryId,
  isoDateFromNow,
  uniqueValue,
} from './helpers/auth.helper.js';

describe('TC-E2E-06: AuditLog de criacao, renovacao e RBAC (RF-013 / RN-008)', () => {
  const req = getRequest();

  it('encontra CREATE e RENEW produzidos pelo proprio documento do teste', async () => {
    const { adminToken, operationalToken } = await getAuthTokens();
    const categoryId = await getCategoryId(adminToken);
    const title = uniqueValue('auditoria-e2e');

    const created = await req
      .post(getApiPath('/api/v1/documents'))
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', title)
      .field('categoryId', categoryId)
      .field('issueDate', isoDateFromNow(-30))
      .field('expirationDate', isoDateFromNow(30));
    expect(created.status).toBe(201);
    const documentId = created.body.document.id as string;

    const renewed = await req
      .post(getApiPath(`/api/v1/documents/${documentId}/renew`))
      .set('Authorization', `Bearer ${operationalToken}`)
      .field('issueDate', isoDateFromNow(0))
      .field('expirationDate', isoDateFromNow(365));
    expect(renewed.status).toBe(200);

    const response = await req
      .get(getApiPath(`/api/v1/audit-logs?documentId=${documentId}&limit=100`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);

    const createLog = response.body.logs.find((log: any) => log.action === 'CREATE');
    const renewLog = response.body.logs.find((log: any) => log.action === 'RENEW');
    expect(createLog).toMatchObject({ documentId, action: 'CREATE' });
    expect(createLog.diffData.title.new).toBe(title);
    expect(renewLog).toMatchObject({ documentId, action: 'RENEW' });
    expect(renewLog.diffData.archivedVersionNumber.new).toBe(1);

    const detail = await req
      .get(getApiPath(`/api/v1/audit-logs/${renewLog.id}`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.log).toMatchObject({ id: renewLog.id, documentId, action: 'RENEW' });
  });

  it('retorna 403 ao Operacional consultar a trilha', async () => {
    const { operationalToken } = await getAuthTokens();
    const response = await req
      .get(getApiPath('/api/v1/audit-logs'))
      .set('Authorization', `Bearer ${operationalToken}`);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('FORBIDDEN');
  });
});
