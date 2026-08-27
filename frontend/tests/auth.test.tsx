import React, { useContext } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosRequestConfig } from 'axios';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AuthContext, AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import api, { TOKEN_STORAGE_KEY } from '@/services/api';
import type { AuthContextType, Role, User } from '@/types/auth';

const admin: User = { id: 'admin-1', name: 'Ana Admin', email: 'ana@docsob.com', role: 'ADMIN', isActive: true };
const operational: User = { ...admin, id: 'operational-1', role: 'OPERATIONAL' };

function AuthState() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is required');
  return <div>{`${value.isLoading}:${value.isAuthenticated}:${value.user?.email ?? 'none'}`}</div>;
}

function LocationState() {
  return <div data-testid="location">{useLocation().pathname}</div>;
}

function authValue(overrides: Partial<AuthContextType> = {}): AuthContextType {
  return {
    user: admin, token: 'jwt-token', isAuthenticated: true, isLoading: false,
    login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(), ...overrides,
  };
}

function renderProtected(value: AuthContextType, allowedRoles?: Role[]) {
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/restricted']}>
        <Routes>
          <Route path="/login" element={<><LocationState />Login</>} />
          <Route path="/unauthorized" element={<><LocationState />Unauthorized</>} />
          <Route path="/restricted" element={<ProtectedRoute allowedRoles={allowedRoles}>Restricted content</ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('restaura uma sessão persistida após validar o token em /auth/me', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'persisted-token');
    vi.spyOn(api, 'get').mockResolvedValue({ data: { user: admin } } as never);

    render(<AuthProvider><AuthState /></AuthProvider>);

    await waitFor(() => expect(screen.getByText(`false:true:${admin.email}`)).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });

  it('persiste o token e normaliza o e-mail ao fazer login', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: {} } as never);
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'new-token', user: admin } } as never);

    function LoginProbe() {
      const value = useContext(AuthContext)!;
      return <button onClick={() => void value.login({ email: '  ana@docsob.com  ', password: 'secret' })}>Entrar</button>;
    }

    render(<AuthProvider><LoginProbe /></AuthProvider>);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('new-token'));
    expect(post).toHaveBeenCalledWith('/auth/login', { email: 'ana@docsob.com', password: 'secret' });
  });

  it('encerra a sessão quando o interceptor comunica acesso não autorizado', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'persisted-token');
    vi.spyOn(api, 'get').mockResolvedValue({ data: { user: admin } } as never);
    render(<AuthProvider><AuthState /></AuthProvider>);
    await screen.findByText(`false:true:${admin.email}`);

    act(() => window.dispatchEvent(new CustomEvent('docsob:unauthorized')));

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(screen.getByText('false:false:none')).toBeInTheDocument();
  });
});

describe('ProtectedRoute', () => {
  it('redireciona visitantes não autenticados para o login', () => {
    renderProtected(authValue({ user: null, token: null, isAuthenticated: false }));
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('bloqueia perfil OPERATIONAL de rota exclusiva de ADMIN', () => {
    renderProtected(authValue({ user: operational }), ['ADMIN']);
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/unauthorized');
  });

  it('permite perfil autorizado e exibe carregamento enquanto valida', () => {
    const { rerender } = render(
      <AuthContext.Provider value={authValue({ isLoading: true })}>
        <MemoryRouter><ProtectedRoute>Restricted content</ProtectedRoute></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Carregando sessão...')).toBeInTheDocument();

    rerender(
      <AuthContext.Provider value={authValue()}>
        <MemoryRouter><ProtectedRoute allowedRoles={['ADMIN']}>Restricted content</ProtectedRoute></MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Restricted content')).toBeInTheDocument();
  });
});

describe('interceptores JWT do cliente API', () => {
  it('anexa o JWT da sessão ao cabeçalho Authorization', async () => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, 'session-token');
    const response = await api.get<AxiosRequestConfig>('/documents', {
      adapter: async (config) => ({ data: config, status: 200, statusText: 'OK', headers: {}, config }),
    });

    expect(response.data.headers?.Authorization).toBe('Bearer session-token');
  });

  it('limpa tokens e emite o evento global em resposta 401 fora do login', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'local-token');
    sessionStorage.setItem(TOKEN_STORAGE_KEY, 'session-token');
    const unauthorized = vi.fn();
    window.addEventListener('docsob:unauthorized', unauthorized);

    await expect(api.get('/documents', {
      adapter: async (config) => Promise.reject({ config, response: { status: 401 } }),
    })).rejects.toMatchObject({ response: { status: 401 } });

    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(unauthorized).toHaveBeenCalledOnce();
    window.removeEventListener('docsob:unauthorized', unauthorized);
  });
});

describe('LoginPage', () => {
  it('impede o envio de credenciais ausentes antes de chamar login', async () => {
    const login = vi.fn();
    render(
      <AuthContext.Provider value={authValue({ user: null, token: null, isAuthenticated: false, login })}>
        <MemoryRouter><LoginPage /></MemoryRouter>
      </AuthContext.Provider>,
    );

    await userEvent.setup().click(screen.getByRole('button', { name: /entrar no sistema/i }));
    expect(screen.getByLabelText('E-mail')).toBeInvalid();
    expect(screen.getByLabelText('Senha')).toBeInvalid();
    expect(login).not.toHaveBeenCalled();
  });

  it('envia credenciais normalizadas e volta à rota originalmente solicitada', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue(undefined);
    render(
      <AuthContext.Provider value={authValue({ user: null, token: null, isAuthenticated: false, login })}>
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/documentos' } } }]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/documentos" element={<LocationState />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await user.type(screen.getByLabelText('E-mail'), '  ana@docsob.com  ');
    await user.type(screen.getByLabelText('Senha'), 'secret');
    await user.click(screen.getByRole('button', { name: /entrar no sistema/i }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({ email: 'ana@docsob.com', password: 'secret' }));
    expect(await screen.findByTestId('location')).toHaveTextContent('/documentos');
  });
});
