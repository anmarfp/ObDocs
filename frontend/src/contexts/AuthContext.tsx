import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AuthContextType, LoginCredentials, User } from '../types/auth';
import { authService, TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Fetch / refresh user profile with active token
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const { user: fetchedUser } = await authService.getMe();
      setUser(fetchedUser);
      setToken(currentToken);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fetchedUser));
    } catch (error) {
      console.warn('Falha ao validar sessão do usuário:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Initial check on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen to global 401 unauthorized events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('docsob:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('docsob:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  // Login action
  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
