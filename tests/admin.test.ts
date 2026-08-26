import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { NotificationMode, Role } from '@prisma/client';

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    companyConfig: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    documentCategory: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../src/lib/prisma.js';
import { app } from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';

describe('Passo 6 - Administração: usuários, configuração e categorias', () => {
  const adminId = 'admin-uuid-1';
  const operationalId = 'operational-uuid-2';
  const userId = 'user-uuid-3';
  const categoryId = 'category-uuid-1';

  const adminToken = generateToken({
    userId: adminId,
    email: 'admin@docsob.com',
    name: 'Admin DocsOb',
    role: Role.ADMIN,
  });
  const operationalToken = generateToken({
    userId: operationalId,
    email: 'operacional@docsob.com',
    name: 'Operacional DocsOb',
    role: Role.OPERATIONAL,
  });

  const managedUser = {
    id: userId,
    name: 'Usuário Gerenciado',
    email: 'usuario@docsob.com',
    passwordHash: 'hash-secreto',
    role: Role.OPERATIONAL,
    isActive: true,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
  };

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Gestão de usuários', () => {
    it('lista usuários para ADMIN sem expor passwordHash', async () => {
      const { passwordHash: _passwordHash, ...listedUser } = managedUser;
      (prisma.user.findMany as any).mockResolvedValue([listedUser]);

      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users).toEqual([expect.objectContaining({ id: userId, email: managedUser.email })]);
      expect(res.body.users[0].passwordHash).toBeUndefined();
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { name: 'asc' } })
      );
    });

    it('cria usuário com e-mail normalizado, senha protegida e perfil padrão OPERATIONAL', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.user.create as any).mockImplementation(({ data }) => ({
        id: userId,
        ...data,
        createdAt: new Date('2026-08-26T10:00:00.000Z'),
      }));

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '  Nova Usuária  ', email: 'NOVA@DOCSOB.COM', password: 'segredo123' });

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({ name: 'Nova Usuária', email: 'nova@docsob.com', role: Role.OPERATIONAL });
      const createdData = (prisma.user.create as any).mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('segredo123');
      expect(await bcrypt.compare('segredo123', createdData.passwordHash)).toBe(true);
    });

    it('rejeita criação com e-mail já cadastrado', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(managedUser);

      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Usuário Duplicado', email: managedUser.email, password: 'segredo123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('EMAIL_ALREADY_EXISTS');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('atualiza dados e papel de um usuário existente', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(managedUser);
      (prisma.user.update as any).mockImplementation(({ data }) => ({ ...managedUser, ...data }));

      const res = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Usuário Promovido', role: Role.ADMIN });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ name: 'Usuário Promovido', role: Role.ADMIN });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: userId }, data: expect.objectContaining({ role: Role.ADMIN }) })
      );
    });

    it('rejeita edição para um e-mail já usado por outro usuário', async () => {
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce(managedUser)
        .mockResolvedValueOnce({ ...managedUser, id: 'other-user' });

      const res = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'outro@docsob.com' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('EMAIL_ALREADY_EXISTS');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('inativa usuário de terceiro e permite reativá-lo', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(managedUser);
      (prisma.user.update as any).mockImplementation(({ data }) => ({ ...managedUser, ...data }));

      const res = await request(app)
        .patch(`/api/v1/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(false);
      expect(res.body.message).toContain('inativado');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } })
      );
    });

    it('impede ADMIN de inativar a própria conta sem consultar ou alterar o banco', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CANNOT_DEACTIVATE_SELF');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('bloqueia OPERATIONAL com 403 em todos os endpoints de gestão de usuários', async () => {
      const responses = await Promise.all([
        request(app).get('/api/v1/users').set('Authorization', `Bearer ${operationalToken}`),
        request(app).post('/api/v1/users').set('Authorization', `Bearer ${operationalToken}`).send({}),
        request(app).put(`/api/v1/users/${userId}`).set('Authorization', `Bearer ${operationalToken}`).send({}),
        request(app).patch(`/api/v1/users/${userId}/status`).set('Authorization', `Bearer ${operationalToken}`),
      ]);

      for (const res of responses) {
        expect(res.status).toBe(403);
        expect(res.body.error).toBe('FORBIDDEN');
      }
    });
  });

  describe('Configuração da empresa', () => {
    const existingConfig = {
      id: 'company-config-1',
      notificationMode: NotificationMode.ALL_ADMINS,
      updatedById: adminId,
      updatedAt: new Date('2026-08-26T10:00:00.000Z'),
      updatedBy: { id: adminId, name: 'Admin DocsOb', email: 'admin@docsob.com' },
    };

    it('retorna a configuração para qualquer usuário autenticado', async () => {
      (prisma.companyConfig.findFirst as any).mockResolvedValue(existingConfig);

      const res = await request(app)
        .get('/api/v1/company/config')
        .set('Authorization', `Bearer ${operationalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.config).toMatchObject({ id: existingConfig.id, notificationMode: NotificationMode.ALL_ADMINS });
    });

    it('inicializa ALL_ADMINS ao consultar uma configuração ainda inexistente', async () => {
      (prisma.companyConfig.findFirst as any).mockResolvedValue(null);
      (prisma.companyConfig.create as any).mockResolvedValue(existingConfig);

      const res = await request(app)
        .get('/api/v1/company/config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(prisma.companyConfig.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { notificationMode: NotificationMode.ALL_ADMINS } })
      );
    });

    it('permite que ADMIN altere o modo e registra quem fez a alteração', async () => {
      (prisma.companyConfig.findFirst as any).mockResolvedValue(existingConfig);
      (prisma.companyConfig.update as any).mockImplementation(({ data }) => ({
        ...existingConfig,
        ...data,
        updatedBy: existingConfig.updatedBy,
      }));

      const res = await request(app)
        .put('/api/v1/company/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notificationMode: NotificationMode.ONLY_RESPONSIBLE });

      expect(res.status).toBe(200);
      expect(res.body.config.notificationMode).toBe(NotificationMode.ONLY_RESPONSIBLE);
      expect(prisma.companyConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: existingConfig.id },
          data: { notificationMode: NotificationMode.ONLY_RESPONSIBLE, updatedById: adminId },
        })
      );
    });

    it('rejeita modo inválido e bloqueia OPERATIONAL de alterar a configuração', async () => {
      const invalid = await request(app)
        .put('/api/v1/company/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notificationMode: 'INVALID' });
      const forbidden = await request(app)
        .put('/api/v1/company/config')
        .set('Authorization', `Bearer ${operationalToken}`)
        .send({ notificationMode: NotificationMode.ONLY_RESPONSIBLE });

      expect(invalid.status).toBe(400);
      expect(invalid.body.error).toBe('VALIDATION_ERROR');
      expect(forbidden.status).toBe(403);
      expect(forbidden.body.error).toBe('FORBIDDEN');
    });
  });

  describe('Categorias de documentos', () => {
    const category = {
      id: categoryId,
      name: 'Fiscal',
      colorHex: '#3b82f6',
      description: 'Documentos fiscais',
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
      documents: [{ id: 'document-1' }],
    };

    it('lista categorias para OPERATIONAL, incluindo a quantidade de documentos associados', async () => {
      (prisma.documentCategory.findMany as any).mockResolvedValue([category]);

      const res = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${operationalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.categories).toEqual([
        expect.objectContaining({ id: categoryId, name: 'Fiscal', documentCount: 1 }),
      ]);
    });

    it('cria categoria para ADMIN, aplicando a cor padrão quando não informada', async () => {
      (prisma.documentCategory.findUnique as any).mockResolvedValue(null);
      (prisma.documentCategory.create as any).mockImplementation(({ data }) => ({
        id: categoryId,
        createdAt: new Date('2026-08-26T10:00:00.000Z'),
        ...data,
      }));

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '  Trabalhista  ', description: ' Obrigações trabalhistas ' });

      expect(res.status).toBe(201);
      expect(res.body.category).toMatchObject({ name: 'Trabalhista', colorHex: '#3b82f6' });
      expect(prisma.documentCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ description: 'Obrigações trabalhistas' }) })
      );
    });

    it('rejeita categoria duplicada sem tentar persistir outra categoria', async () => {
      (prisma.documentCategory.findUnique as any).mockResolvedValue(category);

      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Fiscal' });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('CATEGORY_ALREADY_EXISTS');
      expect(prisma.documentCategory.create).not.toHaveBeenCalled();
    });

    it('impede exclusão de categoria que possui documentos associados', async () => {
      (prisma.documentCategory.findUnique as any).mockResolvedValue(category);

      const res = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('CATEGORY_IN_USE');
      expect(prisma.documentCategory.delete).not.toHaveBeenCalled();
    });

    it('exclui categoria sem documentos e bloqueia OPERATIONAL de criar ou excluir', async () => {
      (prisma.documentCategory.findUnique as any).mockResolvedValue({ ...category, documents: [] });
      (prisma.documentCategory.delete as any).mockResolvedValue({ ...category, documents: [] });

      const deleted = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const createForbidden = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${operationalToken}`)
        .send({ name: 'Nova Categoria' });
      const deleteForbidden = await request(app)
        .delete(`/api/v1/categories/${categoryId}`)
        .set('Authorization', `Bearer ${operationalToken}`);

      expect(deleted.status).toBe(200);
      expect(prisma.documentCategory.delete).toHaveBeenCalledWith({ where: { id: categoryId } });
      expect(createForbidden.status).toBe(403);
      expect(deleteForbidden.status).toBe(403);
    });
  });
});
