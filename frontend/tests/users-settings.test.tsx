import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/services/api';
import * as AuthModule from '@/contexts/AuthContext';
import type { AuthContextType, User } from '@/types/auth';
import type { CompanyConfig } from '@/features/documents/types/document.types';
import type { UserItem } from '@/features/users/types/user.types';
import { userService } from '@/features/users/services/userService';
import { companyService } from '@/features/documents/services/companyService';
import { categoryService } from '@/features/documents/services/categoryService';
import { notificationAdminService } from '@/features/notifications/services/notificationAdminService';
import { googleAuthService } from '@/features/calendar/services/googleAuthService';
import { UsersPage } from '@/pages/users/UsersPage';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import { SettingsPage } from '@/pages/settings/SettingsPage';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);
const apiPut = vi.mocked(api.put);
const apiPatch = vi.mocked(api.patch);
const apiDelete = vi.mocked(api.delete);

const currentUser: User = {
  id: 'admin-1',
  name: 'Ana Admin',
  email: 'ana@docsob.test',
  role: 'ADMIN',
  isActive: true,
};

const otherUser: UserItem = {
  id: 'user-2',
  name: 'Bruno Operacional',
  email: 'bruno@docsob.test',
  role: 'OPERATIONAL',
  isActive: true,
  createdAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-20T00:00:00.000Z',
};

function authValue(): AuthContextType {
  return {
    user: currentUser,
    token: 'jwt',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };
}

function renderWithAuth(node: React.ReactNode) {
  vi.spyOn(AuthModule, 'useAuth').mockReturnValue(authValue());
  return render(<MemoryRouter>{node}</MemoryRouter>);
}

const config: CompanyConfig = {
  id: 'company-1',
  notificationMode: 'ALL_ADMINS',
  updatedAt: '2026-08-27T00:00:00.000Z',
  updatedById: 'admin-1',
};

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
  apiPut.mockReset();
  apiPatch.mockReset();
  apiDelete.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Usuários — contratos sem DELETE', () => {
  it('lista, cria, edita, alterna status e redefine senha pelas cinco rotas suportadas', async () => {
    apiGet.mockResolvedValueOnce({ data: { users: [otherUser] } });
    apiPost.mockResolvedValueOnce({ data: { message: 'criado', user: otherUser } });
    apiPut.mockResolvedValueOnce({ data: { message: 'editado', user: otherUser } });
    apiPatch
      .mockResolvedValueOnce({ data: { message: 'status alterado', user: { ...otherUser, isActive: false } } })
      .mockResolvedValueOnce({ data: { message: 'senha redefinida' } });

    await expect(userService.listUsers()).resolves.toEqual([otherUser]);
    await userService.createUser({
      name: otherUser.name,
      email: otherUser.email,
      password: 'segredo',
      role: 'OPERATIONAL',
    });
    await userService.updateUser('user-2', { name: 'Bruno Atualizado', role: 'ADMIN' });
    await userService.toggleStatus('user-2');
    await userService.resetPassword('user-2', { password: 'novaSenha' });

    expect(apiGet).toHaveBeenCalledWith('/users');
    expect(apiPost).toHaveBeenCalledWith('/users', expect.objectContaining({ password: 'segredo' }));
    expect(apiPut).toHaveBeenCalledWith('/users/user-2', { name: 'Bruno Atualizado', role: 'ADMIN' });
    expect(apiPatch).toHaveBeenNthCalledWith(1, '/users/user-2/status');
    expect(apiPatch).toHaveBeenNthCalledWith(2, '/users/user-2/password', { password: 'novaSenha' });
    expect(apiDelete).not.toHaveBeenCalled();
  });

  it('desabilita o toggle da conta autenticada e permite redefinir a senha de outro usuário', async () => {
    const self: UserItem = {
      ...currentUser,
      isActive: true,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };
    vi.spyOn(userService, 'listUsers').mockResolvedValue([self, otherUser]);
    const resetPassword = vi.spyOn(userService, 'resetPassword').mockResolvedValue({ message: 'Senha alterada' });
    renderWithAuth(<UsersPage />);

    const selfRow = (await screen.findByText('Ana Admin')).closest('tr');
    const otherRow = screen.getByText('Bruno Operacional').closest('tr');
    expect(selfRow).not.toBeNull();
    expect(otherRow).not.toBeNull();
    expect(within(selfRow!).getByRole('button', { name: /Inativar usuário/i })).toBeDisabled();
    expect(within(otherRow!).getByRole('button', { name: /Inativar usuário/i })).toBeEnabled();

    fireEvent.click(within(otherRow!).getByRole('button', { name: /Redefinir senha/i }));
    fireEvent.change(screen.getByPlaceholderText(/Mínimo de 6 caracteres/i), {
      target: { value: 'novaSenha' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Repita a nova senha/i), {
      target: { value: 'novaSenha' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar Nova Senha/i }));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith('user-2', { password: 'novaSenha' }));
    expect(apiDelete).not.toHaveBeenCalled();
  });

  it('valida e cria usuário pela UI sem expor senha após o fechamento', async () => {
    const createUser = vi.spyOn(userService, 'createUser').mockResolvedValue({
      message: 'Usuário criado',
      user: otherUser,
    });
    const onClose = vi.fn();
    render(
      <UserFormModal
        isOpen
        userToEdit={null}
        onClose={onClose}
        onSuccess={vi.fn()}
        onError={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Carlos Silva/i), { target: { value: 'Carla Souza' } });
    fireEvent.change(screen.getByPlaceholderText(/carlos.silva@empresa.com/i), {
      target: { value: 'carla@docsob.test' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Mínimo de 6 caracteres/i), {
      target: { value: '123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Criar Usuário/i }));
    expect(await screen.findByText(/pelo menos 6 caracteres/i)).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(/Mínimo de 6 caracteres/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Criar Usuário/i }));
    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith({
        name: 'Carla Souza',
        email: 'carla@docsob.test',
        password: '123456',
        role: 'OPERATIONAL',
      })
    );
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Configurações — RN-004 e gatilhos administrativos', () => {
  it('usa GET/PUT da empresa e POST para recálculo/digest com DTOs reais', async () => {
    apiGet.mockResolvedValueOnce({ data: { config } });
    apiPut.mockResolvedValueOnce({ data: { message: 'ok', config: { ...config, notificationMode: 'ONLY_RESPONSIBLE' } } });
    apiPost
      .mockResolvedValueOnce({ data: { totalProcessed: 10, updatedCount: 3, alertsSent: 2 } })
      .mockResolvedValueOnce({
        data: {
          success: true,
          recipients: ['admin@docsob.test'],
          subject: 'Resumo',
          total: 2,
          summary: { critical: [], expired: [], total: 2 },
          sentAt: '2026-08-27T12:00:00.000Z',
        },
      });

    await expect(companyService.getConfig()).resolves.toEqual(config);
    await companyService.updateConfig({ notificationMode: 'ONLY_RESPONSIBLE' });
    await expect(notificationAdminService.recalculateStatuses()).resolves.toMatchObject({
      totalProcessed: 10,
      updatedCount: 3,
      alertsSent: 2,
    });
    await expect(notificationAdminService.triggerDailyDigest()).resolves.toMatchObject({
      success: true,
      total: 2,
      recipients: ['admin@docsob.test'],
    });

    expect(apiGet).toHaveBeenCalledWith('/company/config');
    expect(apiPut).toHaveBeenCalledWith('/company/config', { notificationMode: 'ONLY_RESPONSIBLE' });
    expect(apiPost).toHaveBeenNthCalledWith(1, '/notifications/recalculate');
    expect(apiPost).toHaveBeenNthCalledWith(2, '/notifications/digest');
  });

  it('atualiza ALL_ADMINS para ONLY_RESPONSIBLE e confirma os dois gatilhos manuais', async () => {
    vi.spyOn(companyService, 'getConfig').mockResolvedValue(config);
    const updateConfig = vi
      .spyOn(companyService, 'updateConfig')
      .mockResolvedValue({ ...config, notificationMode: 'ONLY_RESPONSIBLE' });
    vi.spyOn(categoryService, 'getCategories').mockResolvedValue([]);
    const recalculate = vi.spyOn(notificationAdminService, 'recalculateStatuses').mockResolvedValue({
      totalProcessed: 10,
      updatedCount: 3,
      alertsSent: 2,
    });
    const digest = vi.spyOn(notificationAdminService, 'triggerDailyDigest').mockResolvedValue({
      success: true,
      recipients: ['admin@docsob.test'],
      subject: 'Resumo',
      total: 2,
      summary: { critical: [], expired: [], total: 2 },
      sentAt: '2026-08-27T12:00:00.000Z',
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(googleAuthService, 'getStatus').mockResolvedValue({ connected: false });

    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    await screen.findByText(/Todos os Administradores/i);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByRole('button', { name: /Salvar Política/i }));
    await waitFor(() =>
      expect(updateConfig).toHaveBeenCalledWith({ notificationMode: 'ONLY_RESPONSIBLE' })
    );

    fireEvent.click(screen.getByRole('button', { name: /Executar Recálculo/i }));
    fireEvent.click(screen.getByRole('button', { name: /Disparar Digest Agora/i }));
    await waitFor(() => {
      expect(recalculate).toHaveBeenCalledTimes(1);
      expect(digest).toHaveBeenCalledTimes(1);
    });
    expect(window.confirm).toHaveBeenCalledTimes(2);
  });
});
