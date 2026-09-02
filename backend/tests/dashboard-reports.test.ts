import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { DocumentStatus, Role } from '@prisma/client';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import { getDashboardMetrics } from '../src/services/dashboardService.js';
import { generateDocumentsCsv, generateSummaryReport } from '../src/services/reportService.js';
import { generateToken } from '../src/utils/jwt.js';

// Mock do Prisma Client usado pelos servi\u00e7os e pelas rotas do Passo 9.
vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    document: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    documentCategory: {
      findMany: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const adminToken = generateToken({
  userId: 'admin-uuid-1',
  email: 'admin@docsobs.com.br',
  name: 'Admin Master',
  role: Role.ADMIN,
});

const operationalToken = generateToken({
  userId: 'operational-uuid-1',
  email: 'operacional@docsobs.com.br',
  name: 'Operador User',
  role: Role.OPERATIONAL,
});

const categories = [
  { id: 'category-license', name: 'Licen\u00e7as', colorHex: '#2E7D32' },
  { id: 'category-certificate', name: 'Certid\u00f5es', colorHex: '#F9A825' },
];

const documents = [
  {
    id: 'document-regular',
    title: 'Alvar\u00e1 de Funcionamento',
    categoryId: 'category-license',
    issuingBody: 'Prefeitura Municipal',
    issueDate: new Date('2026-01-10T00:00:00.000Z'),
    expirationDate: new Date('2027-01-10T00:00:00.000Z'),
    status: DocumentStatus.REGULAR,
    responsibleName: 'Jo\u00e3o Silva',
    responsibleEmail: 'joao@empresa.com.br',
    isArchived: false,
    category: categories[0],
  },
  {
    id: 'document-expired',
    title: 'Certid\u00e3o Negativa',
    categoryId: 'category-certificate',
    issuingBody: 'Receita Federal',
    issueDate: new Date('2025-01-10T00:00:00.000Z'),
    expirationDate: new Date('2026-01-10T00:00:00.000Z'),
    status: DocumentStatus.EXPIRED,
    responsibleName: 'Maria Souza',
    responsibleEmail: 'maria@empresa.com.br',
    isArchived: false,
    category: categories[1],
  },
];

const statusGroups = [
  { status: DocumentStatus.EXPIRED, _count: { _all: 1 } },
  { status: DocumentStatus.REGULAR, _count: { _all: 1 } },
];

function mockMetricsQueries(): void {
  (prisma.document.groupBy as any).mockResolvedValue(statusGroups);
  (prisma.document.count as any)
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(1);
  (prisma.documentCategory.findMany as any).mockResolvedValue(categories);
  (prisma.document.findMany as any).mockResolvedValue(documents);
}

describe('Passo 9 - Dashboard, M\u00e9tricas e Exporta\u00e7\u00e3o de Relat\u00f3rios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('dashboardService.getDashboardMetrics', () => {
    it('consolida os status, conformidade, categorias e pr\u00f3ximos vencimentos para ADMIN', async () => {
      mockMetricsQueries();

      const metrics = await getDashboardMetrics(Role.ADMIN);

      expect(metrics).toMatchObject({
        statusCounts: {
          EXPIRED: 1,
          CRITICAL: 0,
          RENEWAL_IN_PROGRESS: 0,
          REGULAR: 1,
          INDETERMINATE: 0,
        },
        totalActive: 2,
        totalArchived: 1,
        complianceRate: 50,
        byCategory: [
          { categoryId: 'category-license', categoryName: 'Licen\u00e7as', colorHex: '#2E7D32', count: 1 },
          { categoryId: 'category-certificate', categoryName: 'Certid\u00f5es', colorHex: '#F9A825', count: 1 },
        ],
      });
      expect(metrics.upcomingExpirations).toEqual(expect.any(Array));
      expect(prisma.document.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isArchived: false } })
      );
      expect(prisma.document.count).toHaveBeenCalledWith({ where: { isArchived: true } });
    });

    it('restringe o perfil OPERATIONAL aos documentos ativos e n\u00e3o exp\u00f5e arquivados', async () => {
      mockMetricsQueries();

      const metrics = await getDashboardMetrics(Role.OPERATIONAL);

      expect(metrics.totalArchived).toBe(0);
      expect(prisma.document.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isArchived: false } })
      );
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isArchived: false }) })
      );
      expect(prisma.document.count).not.toHaveBeenCalledWith({ where: { isArchived: true } });
    });
  });

  describe('reportService', () => {
    it('gera CSV UTF-8 com BOM, cabe\u00e7alhos em portugu\u00eas e campos escapados', () => {
      const csv = generateDocumentsCsv([
        {
          ...documents[0],
          title: 'Licen\u00e7a "Especial", 2026',
          category: { ...categories[0], name: 'Licen\u00e7as, municipais' },
        },
      ] as any);

      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('ID');
      expect(csv).toContain('T\u00edtulo');
      expect(csv).toContain('Categoria');
      expect(csv).toContain('\u00d3rg\u00e3o Emissor');
      expect(csv).toContain('Data Emiss\u00e3o');
      expect(csv).toContain('Data Vencimento');
      expect(csv).toContain('Status');
      expect(csv).toContain('Respons\u00e1vel');
      expect(csv).toContain('E-mail Respons\u00e1vel');
      expect(csv).toContain('"Licen\u00e7a ""Especial"", 2026"');
      expect(csv).toContain('"Licen\u00e7as, municipais"');
    });

    it('gera resumo executivo com total, conformidade e contagem completa por status', () => {
      const summary = generateSummaryReport(documents as any);

      expect(summary).toMatchObject({
        totalDocuments: 2,
        complianceRate: 50,
        statusCounts: {
          EXPIRED: 1,
          CRITICAL: 0,
          RENEWAL_IN_PROGRESS: 0,
          REGULAR: 1,
          INDETERMINATE: 0,
        },
      });
    });
  });

  describe('GET /api/v1/dashboard/metrics', () => {
    it('retorna 401 sem token de autentica\u00e7\u00e3o', async () => {
      const response = await request(app).get('/api/v1/dashboard/metrics');

      expect(response.status).toBe(401);
    });

    it('retorna m\u00e9tricas completas para ADMIN', async () => {
      mockMetricsQueries();

      const response = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        statusCounts: expect.any(Object),
        totalActive: 2,
        totalArchived: 1,
        complianceRate: 50,
        byCategory: expect.any(Array),
        upcomingExpirations: expect.any(Array),
      });
    });

    it('retorna m\u00e9tricas sem documentos arquivados para OPERATIONAL', async () => {
      mockMetricsQueries();

      const response = await request(app)
        .get('/api/v1/dashboard/metrics')
        .set('Authorization', `Bearer ${operationalToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalArchived).toBe(0);
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isArchived: false }) })
      );
    });
  });

  describe('GET /api/v1/reports/export', () => {
    it('retorna 401 sem token de autentica\u00e7\u00e3o', async () => {
      const response = await request(app).get('/api/v1/reports/export');

      expect(response.status).toBe(401);
    });

    it('exporta CSV por padr\u00e3o com headers de download', async () => {
      (prisma.document.findMany as any).mockResolvedValue(documents);

      const response = await request(app)
        .get('/api/v1/reports/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text.startsWith('\uFEFF')).toBe(true);
      expect(response.text).toContain('T\u00edtulo');
    });

    it('exporta JSON quando format=json', async () => {
      (prisma.document.findMany as any).mockResolvedValue(documents);

      const response = await request(app)
        .get('/api/v1/reports/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.documents).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'document-regular' })]));
    });

    it('aplica filtros de status e categoria \u00e0 consulta de exporta\u00e7\u00e3o', async () => {
      (prisma.document.findMany as any).mockResolvedValue([documents[1]]);

      const response = await request(app)
        .get(`/api/v1/reports/export?status=${DocumentStatus.EXPIRED}&categoryId=category-certificate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DocumentStatus.EXPIRED,
            categoryId: 'category-certificate',
          }),
        })
      );
    });
  });

  describe('GET /api/v1/reports/summary', () => {
    it('retorna 401 sem token de autentica\u00e7\u00e3o', async () => {
      const response = await request(app).get('/api/v1/reports/summary');

      expect(response.status).toBe(401);
    });

    it.each([
      ['ADMIN', adminToken],
      ['OPERATIONAL', operationalToken],
    ])('retorna resumo executivo para %s', async (_role, token) => {
      (prisma.document.findMany as any).mockResolvedValue(documents);

      const response = await request(app)
        .get('/api/v1/reports/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        totalDocuments: 2,
        complianceRate: 50,
        statusCounts: expect.objectContaining({
          EXPIRED: 1,
          REGULAR: 1,
        }),
      });
    });
  });
});
