import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthResponse, LoginCredentials, User } from '../types/auth';

export const TOKEN_STORAGE_KEY = 'docsobs_token';
export const USER_STORAGE_KEY = 'docsobs_user';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Global 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear credentials if token is invalid or expired
      const isLoginEndpoint = error.config?.url?.includes('/auth/login');
      if (!isLoginEndpoint) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('docsobs:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },
};

export default api;
