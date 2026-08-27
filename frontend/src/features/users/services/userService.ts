import api from '@/services/api';
import {
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserItem,
  UsersListResponse,
} from '../types/user.types';

export const userService = {
  /**
   * List all users from GET /users (Admin only)
   */
  listUsers: async (): Promise<UserItem[]> => {
    const response = await api.get<UsersListResponse>('/users');
    return response.data.users;
  },

  /**
   * Create a new user from POST /users (Admin only)
   */
  createUser: async (data: CreateUserInput): Promise<{ message: string; user: UserItem }> => {
    const response = await api.post<{ message: string; user: UserItem }>('/users', data);
    return response.data;
  },

  /**
   * Update an existing user from PUT /users/:id (Admin only)
   */
  updateUser: async (
    id: string,
    data: UpdateUserInput
  ): Promise<{ message: string; user: UserItem }> => {
    const response = await api.put<{ message: string; user: UserItem }>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Toggle user active/inactive status from PATCH /users/:id/status (Admin only)
   */
  toggleStatus: async (id: string): Promise<{ message: string; user: UserItem }> => {
    const response = await api.patch<{ message: string; user: UserItem }>(`/users/${id}/status`);
    return response.data;
  },

  /**
   * Reset user password from PATCH /users/:id/password (Admin only)
   */
  resetPassword: async (
    id: string,
    data: ResetPasswordInput
  ): Promise<{ message: string }> => {
    const response = await api.patch<{ message: string }>(`/users/${id}/password`, data);
    return response.data;
  },
};
