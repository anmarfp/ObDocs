import { describe, it, expect } from 'vitest';
import { getRequest, getApiPath, getAuthTokens, uniqueValue } from './helpers/auth.helper.js';

describe('TC-E2E-08: Gestao Admin, reset, inativacao e bloqueio (RF-010 / RF-011)', () => {
  const req = getRequest();

  it('executa o ciclo create, list/read, update, reset, login e inativacao', async () => {
    const { adminToken } = await getAuthTokens();
    const email = `${uniqueValue('usuario').toLowerCase()}@docsobs.test`;
    const initialPassword = 'SenhaOriginal123!';
    const updatedPassword = 'NovaSenhaAtualizada456!';

    const created = await req
      .post(getApiPath('/api/v1/users'))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Usuario E2E', email, password: initialPassword, role: 'OPERATIONAL' });
    expect(created.status).toBe(201);
    expect(created.body.user).toMatchObject({ email, role: 'OPERATIONAL', isActive: true });
    expect(created.body.user).not.toHaveProperty('passwordHash');
    const userId = created.body.user.id as string;

    const listed = await req
      .get(getApiPath('/api/v1/users'))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listed.status).toBe(200);
    expect(listed.body.users.some((user: any) => user.id === userId)).toBe(true);

    const updated = await req
      .put(getApiPath(`/api/v1/users/${userId}`))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Usuario E2E Atualizado', role: 'ADMIN' });
    expect(updated.status).toBe(200);
    expect(updated.body.user).toMatchObject({ name: 'Usuario E2E Atualizado', role: 'ADMIN' });

    const reset = await req
      .patch(getApiPath(`/api/v1/users/${userId}/password`))
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: updatedPassword });
    expect(reset.status).toBe(200);

    const login = await req
      .post(getApiPath('/api/v1/auth/login'))
      .send({ email, password: updatedPassword });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();

    const deactivated = await req
      .patch(getApiPath(`/api/v1/users/${userId}/status`))
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.user.isActive).toBe(false);

    const blockedLogin = await req
      .post(getApiPath('/api/v1/auth/login'))
      .send({ email, password: updatedPassword });
    expect(blockedLogin.status).toBe(401);
    expect(blockedLogin.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('bloqueia auto-inativacao do Admin e gestao por Operacional', async () => {
    const { adminToken, operationalToken } = await getAuthTokens();
    const me = await req
      .get(getApiPath('/api/v1/auth/me'))
      .set('Authorization', `Bearer ${adminToken}`);
    const selfToggle = await req
      .patch(getApiPath(`/api/v1/users/${me.body.user.id}/status`))
      .set('Authorization', `Bearer ${adminToken}`);
    const operationalAccess = await req
      .get(getApiPath('/api/v1/users'))
      .set('Authorization', `Bearer ${operationalToken}`);

    expect(selfToggle.status).toBe(400);
    expect(selfToggle.body.error).toBe('CANNOT_DEACTIVATE_SELF');
    expect(operationalAccess.status).toBe(403);
    expect(operationalAccess.body.error).toBe('FORBIDDEN');
  });
});
