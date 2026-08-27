import React, { createContext, useState, useEffect, useCallback } from 'react';
import api, { TOKEN_STORAGE_KEY } from '@/services/api';
import { User, LoginCredentials, AuthResponse, AuthContextType } from '@/types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<{ user: User }>('/auth/me');
      if (response.data?.user) {
        setUser(response.data.user);
        setToken(storedToken);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password,
      });

      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Checagem de autenticação no mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listener para evento customizado de logout disparado pelo interceptor 401
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('docsob:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('docsob:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
