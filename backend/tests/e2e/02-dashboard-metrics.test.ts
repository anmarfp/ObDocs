import { describe, it, expect } from 'vitest';
import {
  getRequest,
  getApiPath,
  getAuthTokens,
  getCategoryId,
  isoDateFromNow,
  uniqueValue,
} from './helpers/auth.helper.js';

describe('TC-E2E-02: Dashboard e metricas agregadas por status (RF-007)', () => {
  const req = getRequest();

  it('reflete exatamente os documentos E2E criados em EXPIRED, CRITICAL e REGULAR', async () => {
    const { adminToken } = await getAuthTokens();
    const categoryId = await getCategoryId(adminToken);
    const before = await req
      .get(getApiPath('/api/v1/dashboard/metrics'))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(before.status).toBe(200);

    const cases = [
      { suffix: 'expired', expirationDate: isoDateFromNow(-2), status: 'EXPIRED' },
      { suffix: 'critical', expirationDate: isoDateFromNow(5), status: 'CRITICAL' },
      { suffix: 'regular', expirationDate: isoDateFromNow(120), status: 'REGULAR' },
    ] as const;

    for (const testCase of cases) {
      const created = await req
        .post(getApiPath('/api/v1/documents'))
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', uniqueValue(`dashboard-${testCase.suffix}`))
        .field('categoryId', categoryId)
        .field('issueDate', isoDateFromNow(-30))
        .field('expirationDate', testCase.expirationDate)
        .field('alertLeadDays', '30');

      expect(created.status).toBe(201);
      expect(created.body.document.status).toBe(testCase.status);
    }

    const after = await req
      .get(getApiPath('/api/v1/dashboard/metrics'))
      .set('Authorization', `Bearer ${adminToken}`);

    expect(after.status).toBe(200);
    expect(after.body.totalActive).toBe(before.body.totalActive + 3);
    for (const status of ['EXPIRED', 'CRITICAL', 'REGULAR']) {
      expect(after.body.statusCounts[status]).toBe(before.body.statusCounts[status] + 1);
    }
    expect(after.body.complianceRate).toBeGreaterThanOrEqual(0);
    expect(after.body.complianceRate).toBeLessThanOrEqual(100);
    expect(Array.isArray(after.body.byCategory)).toBe(true);
    expect(Array.isArray(after.body.upcomingExpirations)).toBe(true);
  });

  it('rejeita acesso sem autenticacao', async () => {
    const response = await req.get(getApiPath('/api/v1/dashboard/metrics'));
    expect(response.status).toBe(401);
  });
});
