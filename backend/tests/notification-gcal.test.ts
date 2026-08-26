import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { DocumentStatus, NotificationMode, Role, SyncStatus } from '@prisma/client';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    companyConfig: { findFirst: vi.fn() },
    user: { findMany: vi.fn(), findUnique: vi.fn() },
    document: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    gCalSyncLog: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import { app } from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';

/**
 * Contrato do Passo 8. Estes imports são dinâmicos para que as verificações de
 * rota continuem a diagnosticar a ausência das rotas quando o módulo ainda não
 * tiver sido implementado.
 */
type NotificationService = typeof import('../src/services/notificationService.js');
type CronService = typeof import('../src/services/cronService.js');
type GCalService = typeof import('../src/services/gcalService.js');

const today = new Date('2026-08-26T12:00:00.000Z');
const category = { id: 'category-1', name: 'Fiscal', colorHex: '#3b82f6' };
const documentFixture = {
  id: 'document-1',
  title: 'Certidão Negativa de Débitos',
  categoryId: category.id,
  category,
  issueDate: new Date('2026-01-01T00:00:00.000Z'),
  expirationDate: new Date('2026-08-30T00:00:00.000Z'),
  alertLeadDays: 10,
  status: DocumentStatus.REGULAR,
  responsibleName: 'Responsável DocsOb',
  responsibleEmail: 'responsavel@docsob.com',
  isArchived: false,
  createdById: 'admin-1',
};
const admins = [
  { id: 'admin-1', name: 'Admin Um', email: 'admin1@docsob.com', role: Role.ADMIN, isActive: true },
  { id: 'admin-2', name: 'Admin Dois', email: 'admin2@docsob.com', role: Role.ADMIN, isActive: true },
];

describe('Passo 8 - Notificações, cron e Google Calendar', () => {
  const adminToken = generateToken({
    userId: 'admin-1', email: admins[0].email, name: admins[0].name, role: Role.ADMIN,
  });
  const operationalToken = generateToken({
    userId: 'operational-1', email: 'operational@docsob.com', name: 'Operacional', role: Role.OPERATIONAL,
  });

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.companyConfig.findFirst as any).mockResolvedValue({
      id: 'config-1', notificationMode: NotificationMode.ALL_ADMINS,
    });
    (prisma.user.findMany as any).mockResolvedValue(admins);
  });

  describe('notificationService', () => {
    let notificationService: NotificationService;

    beforeAll(async () => {
      notificationService = await import('../src/services/notificationService.js');
    });

    it('resolve os administradores ativos como destinatários no modo ALL_ADMINS', () => {
      const recipients = notificationService.resolveNotificationRecipients(
        documentFixture as any,
        { notificationMode: NotificationMode.ALL_ADMINS } as any,
        admins as any,
      );

      expect(recipients).toEqual(['admin1@docsob.com', 'admin2@docsob.com']);
    });

    it('resolve somente o e-mail do responsável no modo ONLY_RESPONSIBLE', () => {
      const recipients = notificationService.resolveNotificationRecipients(
        documentFixture as any,
        { notificationMode: NotificationMode.ONLY_RESPONSIBLE } as any,
        admins as any,
      );

      expect(recipients).toEqual(['responsavel@docsob.com']);
    });

    it('envia alerta crítico formatado com status CRITICAL e dados do documento', async () => {
      const result = await notificationService.sendExpirationAlert(
        { ...documentFixture, status: DocumentStatus.CRITICAL } as any,
        ['admin1@docsob.com'],
        true,
      );

      expect(result).toEqual(expect.objectContaining({ status: DocumentStatus.CRITICAL }));
      expect(result).toEqual(expect.objectContaining({ recipients: ['admin1@docsob.com'] }));
      expect(result).toEqual(expect.objectContaining({ subject: expect.stringContaining(documentFixture.title) }));
    });

    it('envia alerta vencido formatado com status EXPIRED', async () => {
      const result = await notificationService.sendExpirationAlert(
        { ...documentFixture, status: DocumentStatus.EXPIRED } as any,
        ['responsavel@docsob.com'],
        false,
      );

      expect(result).toEqual(expect.objectContaining({ status: DocumentStatus.EXPIRED }));
      expect(result).toEqual(expect.objectContaining({ recipients: ['responsavel@docsob.com'] }));
      expect(result).toEqual(expect.objectContaining({ subject: expect.stringMatching(/vencid/i) }));
    });

    it('envia o digest diário consolidando os documentos que exigem ação', async () => {
      const summary = {
        critical: [{ ...documentFixture, status: DocumentStatus.CRITICAL }],
        expired: [{ ...documentFixture, id: 'document-2', status: DocumentStatus.EXPIRED }],
        total: 2,
      };

      const result = await notificationService.sendDailyDigest(admins as any, summary as any);

      expect(result).toEqual(expect.objectContaining({ recipients: admins.map((admin) => admin.email) }));
      expect(result).toEqual(expect.objectContaining({ subject: expect.stringMatching(/digest|resumo/i) }));
      expect(result).toEqual(expect.objectContaining({ total: 2 }));
    });
  });

  describe('cronService', () => {
    let cronService: CronService;

    beforeAll(async () => {
      cronService = await import('../src/services/cronService.js');
    });

    it('recalcula documentos ativos, preserva estados manuais e dispara alertas pertinentes', async () => {
      const critical = { ...documentFixture, id: 'critical', status: DocumentStatus.REGULAR };
      const expired = {
        ...documentFixture, id: 'expired', expirationDate: new Date('2026-08-20T00:00:00.000Z'), status: DocumentStatus.REGULAR,
      };
      const renewal = { ...documentFixture, id: 'renewal', status: DocumentStatus.RENEWAL_IN_PROGRESS };
      const indeterminate = { ...documentFixture, id: 'indeterminate', expirationDate: null, status: DocumentStatus.INDETERMINATE };
      (prisma.document.findMany as any).mockResolvedValue([critical, expired, renewal, indeterminate]);
      (prisma.document.update as any).mockImplementation(({ where, data }: any) => ({
        ...[critical, expired, renewal, indeterminate].find((document) => document.id === where.id), ...data,
      }));

      const result = await cronService.recalculateAllStatuses();

      expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isArchived: false } }));
      expect(prisma.document.update).toHaveBeenCalledTimes(2);
      expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'critical' }, data: expect.objectContaining({ status: DocumentStatus.CRITICAL }),
      }));
      expect(prisma.document.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'expired' }, data: expect.objectContaining({ status: DocumentStatus.EXPIRED }),
      }));
      expect(prisma.document.update).not.toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'renewal' } }));
      expect(prisma.document.update).not.toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'indeterminate' } }));
      expect(result).toEqual({ totalProcessed: 4, updatedCount: 2, alertsSent: 2 });
    });

    it('executa o digest diário para os administradores ativos', async () => {
      (prisma.document.findMany as any).mockResolvedValue([
        { ...documentFixture, status: DocumentStatus.CRITICAL },
        { ...documentFixture, id: 'expired', status: DocumentStatus.EXPIRED },
      ]);

      const result = await cronService.runDailyDigestJob();

      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { role: Role.ADMIN, isActive: true },
      }));
      expect(result).toEqual(expect.objectContaining({ recipients: admins.map((admin) => admin.email) }));
    });
  });

  describe('gcalService', () => {
    let gcalService: GCalService;

    beforeAll(async () => {
      gcalService = await import('../src/services/gcalService.js');
    });

    it('cria ou atualiza o evento e grava log SYNCED', async () => {
      (prisma.gCalSyncLog.findMany as any).mockResolvedValue([]);
      (prisma.gCalSyncLog.create as any).mockResolvedValue({ id: 'sync-log-1' });

      const result = await gcalService.syncDocumentEvent(documentFixture as any, 'create');

      expect(result).toEqual(expect.objectContaining({ documentId: documentFixture.id, status: SyncStatus.SYNCED }));
      expect(prisma.gCalSyncLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ documentId: documentFixture.id, status: SyncStatus.SYNCED }),
      }));
    });

    it('registra ERROR no log quando a sincronização do evento falha', async () => {
      (prisma.gCalSyncLog.create as any).mockResolvedValue({ id: 'sync-log-error' });

      await expect(gcalService.syncDocumentEvent({ ...documentFixture, expirationDate: null } as any, 'update'))
        .resolves.toEqual(expect.objectContaining({ status: SyncStatus.ERROR }));
      expect(prisma.gCalSyncLog.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ documentId: documentFixture.id, status: SyncStatus.ERROR, errorMessage: expect.any(String) }),
      }));
    });

    it('sincroniza em lote todos os documentos ativos com vencimento', async () => {
      const secondDocument = { ...documentFixture, id: 'document-2' };
      (prisma.document.findMany as any).mockResolvedValue([documentFixture, secondDocument]);
      (prisma.gCalSyncLog.create as any).mockResolvedValue({ id: 'sync-log' });

      const result = await gcalService.syncAllDocuments();

      expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isArchived: false, expirationDate: { not: null } }),
      }));
      expect(result).toEqual(expect.objectContaining({ total: 2, synced: 2 }));
    });
  });

  describe('Integração das rotas de notificações', () => {
    it('protege o recálculo: 401 sem token, 403 para OPERATIONAL e 200 para ADMIN', async () => {
      const unauthorized = await request(app).post('/api/v1/notifications/recalculate');
      const forbidden = await request(app)
        .post('/api/v1/notifications/recalculate')
        .set('Authorization', `Bearer ${operationalToken}`);
      const allowed = await request(app)
        .post('/api/v1/notifications/recalculate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unauthorized.status).toBe(401);
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error).toBe('FORBIDDEN');
      expect(allowed.status).toBe(200);
      expect(allowed.body).toEqual(expect.objectContaining({
        totalProcessed: expect.any(Number), updatedCount: expect.any(Number), alertsSent: expect.any(Number),
      }));
    });

    it('protege o digest: 401 sem token, 403 para OPERATIONAL e 200 para ADMIN', async () => {
      const unauthorized = await request(app).post('/api/v1/notifications/digest');
      const forbidden = await request(app)
        .post('/api/v1/notifications/digest')
        .set('Authorization', `Bearer ${operationalToken}`);
      const allowed = await request(app)
        .post('/api/v1/notifications/digest')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unauthorized.status).toBe(401);
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error).toBe('FORBIDDEN');
      expect(allowed.status).toBe(200);
    });
  });

  describe('Integração das rotas de calendário', () => {
    const calendarDocument = { ...documentFixture, status: DocumentStatus.CRITICAL };

    it('exige autenticação para listar eventos', async () => {
      const res = await request(app).get('/api/v1/calendar/events');
      expect(res.status).toBe(401);
    });

    it('lista eventos para ADMIN e OPERATIONAL com o contrato do calendário', async () => {
      (prisma.document.findMany as any).mockResolvedValue([calendarDocument]);

      const [adminResponse, operationalResponse] = await Promise.all([
        request(app).get('/api/v1/calendar/events').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/v1/calendar/events').set('Authorization', `Bearer ${operationalToken}`),
      ]);

      for (const response of [adminResponse, operationalResponse]) {
        expect(response.status).toBe(200);
        expect(response.body.events).toEqual([expect.objectContaining({
          id: calendarDocument.id,
          title: calendarDocument.title,
          expirationDate: calendarDocument.expirationDate.toISOString(),
          status: DocumentStatus.CRITICAL,
          category: expect.objectContaining({ id: category.id, name: category.name }),
          colorHex: category.colorHex,
        })]);
      }
    });

    it('aplica os filtros month e year na consulta de eventos', async () => {
      (prisma.document.findMany as any).mockResolvedValue([calendarDocument]);

      const res = await request(app)
        .get('/api/v1/calendar/events?month=8&year=2026')
        .set('Authorization', `Bearer ${operationalToken}`);

      expect(res.status).toBe(200);
      expect(prisma.document.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ expirationDate: expect.objectContaining({ gte: expect.any(Date), lte: expect.any(Date) }) }),
      }));
    });

    it('permite sincronização sob demanda para ADMIN e OPERATIONAL, mas exige autenticação', async () => {
      const unauthorized = await request(app).post('/api/v1/calendar/sync');
      const adminResponse = await request(app)
        .post('/api/v1/calendar/sync')
        .set('Authorization', `Bearer ${adminToken}`);
      const operationalResponse = await request(app)
        .post('/api/v1/calendar/sync')
        .set('Authorization', `Bearer ${operationalToken}`);

      expect(unauthorized.status).toBe(401);
      expect(adminResponse.status).toBe(200);
      expect(operationalResponse.status).toBe(200);
    });

    it('protege os logs: 401 sem token, 403 para OPERATIONAL e 200 para ADMIN', async () => {
      const logs = [{
        id: 'sync-log-1', documentId: documentFixture.id, gcalEventId: 'event-1', status: SyncStatus.SYNCED,
        lastSyncedAt: today, errorMessage: null, document: { id: documentFixture.id, title: documentFixture.title },
      }];
      (prisma.gCalSyncLog.count as any).mockResolvedValue(1);
      (prisma.gCalSyncLog.findMany as any).mockResolvedValue(logs);

      const unauthorized = await request(app).get('/api/v1/calendar/sync-logs');
      const forbidden = await request(app)
        .get('/api/v1/calendar/sync-logs')
        .set('Authorization', `Bearer ${operationalToken}`);
      const allowed = await request(app)
        .get('/api/v1/calendar/sync-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unauthorized.status).toBe(401);
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error).toBe('FORBIDDEN');
      expect(allowed.status).toBe(200);
      expect(allowed.body.logs).toEqual([expect.objectContaining({ id: 'sync-log-1', status: SyncStatus.SYNCED })]);
    });
  });
});
