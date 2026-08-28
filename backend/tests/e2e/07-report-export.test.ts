import { describe, it, expect } from 'vitest';
import {
  getRequest,
  getApiPath,
  getAuthTokens,
  getCategoryId,
  isoDateFromNow,
  uniqueValue,
} from './helpers/auth.helper.js';

describe('TC-E2E-07: Exportacao CSV e relatorios (RF-007)', () => {
  const req = getRequest();

  it('exporta headers, BOM UTF-8, Content-Disposition e o documento criado', async () => {
    const { adminToken } = await getAuthTokens();
    const categoryId = await getCategoryId(adminToken);
    const title = `${uniqueValue('Relatorio-E2E')}, com virgula`;

    const created = await req
      .post(getApiPath('/api/v1/documents'))
      .set('Authorization', `Bearer ${adminToken}`)
      .field('title', title)
      .field('categoryId', categoryId)
      .field('issueDate', isoDateFromNow(-15))
      .field('expirationDate', isoDateFromNow(180));
    expect(created.status).toBe(201);

    const response = await req
      .get(getApiPath('/api/v1/reports/export?format=csv'))
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="relatorio-documentos-\d{4}-\d{2}-\d{2}\.csv"$/
    );
    expect(response.text.charCodeAt(0)).toBe(0xfeff);
    const header = response.text.split('\n')[0];
    for (const expectedHeader of ['ID', 'Categoria', 'Status', 'E-mail']) {
      expect(header).toContain(expectedHeader);
    }
    expect(response.text).toContain(`"${title}"`);
  });

  it('exporta JSON e resumo com estruturas consistentes', async () => {
    const { operationalToken } = await getAuthTokens();
    const [json, summary] = await Promise.all([
      req
        .get(getApiPath('/api/v1/reports/export?format=json'))
        .set('Authorization', `Bearer ${operationalToken}`),
      req
        .get(getApiPath('/api/v1/reports/summary'))
        .set('Authorization', `Bearer ${operationalToken}`),
    ]);

    expect(json.status).toBe(200);
    expect(Array.isArray(json.body.documents)).toBe(true);
    expect(json.body.total).toBe(json.body.documents.length);
    expect(summary.status).toBe(200);
    expect(summary.body.totalDocuments).toBeTypeOf('number');
    expect(summary.body.statusCounts).toBeDefined();
  });
});
