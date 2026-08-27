import { Role } from '@/features/documents/types/document.types';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
}

export interface ResetPasswordInput {
  password: string;
}

export interface UsersListResponse {
  users: UserItem[];
}
