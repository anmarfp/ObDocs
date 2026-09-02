import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as AuthModule from '@/contexts/AuthContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { authService, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '@/services/api';
import type { AuthContextType, User } from '@/types/auth';

const admin: User = { id: '1', name: 'Ana', email: 'ana@docsobs.com', role: 'ADMIN', isActive: true };

function Probe() {
  const auth = useAuth();
  return <div>{`${auth.isLoading}:${auth.isAuthenticated}:${auth.user?.email ?? 'none'}`}</div>;
}

function value(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: admin,
    token: 'jwt',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('AuthContext e RBAC', () => {
  it('restaura usuario/token persistidos apos validar /auth/me', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'jwt');
    vi.spyOn(authService, 'getMe').mockResolvedValue({ user: admin });
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByText(`false:true:${admin.email}`)).toBeInTheDocument());
    expect(localStorage.getItem(USER_STORAGE_KEY)).toContain(admin.email);
  });

  it('persiste as credenciais retornadas no login', async () => {
    vi.spyOn(authService, 'getMe').mockResolvedValue({ user: admin });
    vi.spyOn(authService, 'login').mockResolvedValue({ token: 'new-jwt', user: admin });
    function Login() {
      const auth = useAuth();
      return <button onClick={() => void auth.login({ email: admin.email, password: 'secret' })}>login</button>;
    }
    render(<AuthProvider><Login /></AuthProvider>);
    screen.getByRole('button').click();
    await waitFor(() => expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('new-jwt'));
  });

  it('redireciona visitante e bloqueia role nao autorizada', () => {
    vi.spyOn(AuthModule, 'useAuth').mockReturnValue(
      value({ user: null, token: null, isAuthenticated: false })
    );
    render(
      <MemoryRouter initialEntries={['/private']}>
        <Routes>
          <Route path="/login" element={<div>login</div>} />
          <Route path="/private" element={<ProtectedRoute>privado</ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('login')).toBeInTheDocument();

    vi.mocked(AuthModule.useAuth).mockReturnValue(
      value({ user: { ...admin, role: 'OPERATIONAL' } })
    );
    render(
      <MemoryRouter>
        <ProtectedRoute allowedRoles={['ADMIN']}>privado</ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText(/acesso restrito/i)).toBeInTheDocument();
  });
});
