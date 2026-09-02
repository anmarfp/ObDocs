import { describe, it, expect } from 'vitest';
import { getRequest, getApiPath, getAuthTokens } from './helpers/auth.helper.js';

describe('TC-E2E-01: Autenticacao, JWT, /me e RBAC (RF-009 / RF-010)', () => {
  const req = getRequest();

  it('serve a SPA, login e deep link pelo Nginx', async () => {
    for (const route of ['/', '/login', '/documentos/deep-link-e2e']) {
      const response = await req.get(route);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<div id="root">');
    }
  });

  it('responde ao healthcheck da API atraves do proxy', async () => {
    const response = await req.get(getApiPath('/api/v1/health'));
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'docsobs-backend' });
  });

  it('autentica Admin e Operacional e valida seus JWTs em /me', async () => {
    const { adminToken, operationalToken } = await getAuthTokens();

    const [adminMe, operationalMe] = await Promise.all([
      req.get(getApiPath('/api/v1/auth/me')).set('Authorization', `Bearer ${adminToken}`),
      req.get(getApiPath('/api/v1/auth/me')).set('Authorization', `Bearer ${operationalToken}`),
    ]);

    expect(adminMe.status).toBe(200);
    expect(adminMe.body.user).toMatchObject({ email: 'admin@docsobs.com.br', role: 'ADMIN' });
    expect(adminMe.body.user).not.toHaveProperty('passwordHash');
    expect(operationalMe.status).toBe(200);
    expect(operationalMe.body.user).toMatchObject({
      email: 'operacional@docsobs.com.br',
      role: 'OPERATIONAL',
    });
  });

  it('rejeita credenciais invalidas e JWT corrompido com 401', async () => {
    const invalidLogin = await req
      .post(getApiPath('/api/v1/auth/login'))
      .send({ email: 'admin@docsobs.com.br', password: 'SenhaErrada999!' });
    const invalidJwt = await req
      .get(getApiPath('/api/v1/auth/me'))
      .set('Authorization', 'Bearer jwt-corrompido');

    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.body.error).toBe('INVALID_CREDENTIALS');
    expect(invalidJwt.status).toBe(401);
    expect(invalidJwt.body.error).toBe('INVALID_TOKEN');
  });

  it('aplica RBAC e bloqueia Operacional em rota Admin', async () => {
    const { operationalToken } = await getAuthTokens();
    const response = await req
      .get(getApiPath('/api/v1/users'))
      .set('Authorization', `Bearer ${operationalToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('FORBIDDEN');
  });
});
