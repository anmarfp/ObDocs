import api from '@/services/api';
import { DocumentCategory } from '../types/document.types';

export const categoryService = {
  /**
   * Get all document categories.
   */
  getCategories: async (): Promise<DocumentCategory[]> => {
    const response = await api.get<{ categories: DocumentCategory[] }>('/categories');
    return response.data.categories;
  },

  /**
   * Create a new category (Admin only).
   */
  createCategory: async (data: {
    name: string;
    colorHex?: string;
    description?: string;
  }): Promise<DocumentCategory> => {
    const response = await api.post<{ message: string; category: DocumentCategory }>(
      '/categories',
      data
    );
    return response.data.category;
  },

  /**
   * Delete a category by ID (Admin only).
   */
  deleteCategory: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/categories/${id}`);
    return response.data;
  },
};
