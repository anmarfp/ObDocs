import api from '@/services/api';
import {
  Document,
  DocumentFilterParams,
  DocumentListResponse,
  DocumentVersion,
} from '../types/document.types';

export const documentService = {
  /**
   * List documents with optional filters (search, categoryId, status, includeArchived).
   * Note: The backend returns exactly { documents, total }.
   */
  getDocuments: async (params?: DocumentFilterParams): Promise<DocumentListResponse> => {
    const cleanParams: Record<string, string | boolean> = {};
    if (params) {
      if (params.search && params.search.trim()) {
        cleanParams.search = params.search.trim();
      }
      if (params.categoryId && params.categoryId.trim()) {
        cleanParams.categoryId = params.categoryId.trim();
      }
      if (params.status && params.status.trim()) {
        cleanParams.status = params.status.trim();
      }
      if (params.includeArchived !== undefined) {
        cleanParams.includeArchived = params.includeArchived;
      }
    }

    const response = await api.get<DocumentListResponse>('/documents', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Get full details of a specific document by ID.
   */
  getDocumentById: async (id: string): Promise<Document> => {
    const response = await api.get<{ document: Document }>(`/documents/${id}`);
    return response.data.document;
  },

  /**
   * Get the version history of a document.
   */
  getDocumentVersions: async (id: string): Promise<DocumentVersion[]> => {
    const response = await api.get<{ documentId: string; versions: DocumentVersion[] }>(
      `/documents/${id}/versions`
    );
    return response.data.versions;
  },

  /**
   * Create a new document with multipart/form-data.
   */
  createDocument: async (
    formData: FormData,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<{ message: string; document: Document }> => {
    const response = await api.post<{ message: string; document: Document }>(
      '/documents',
      formData,
      {
        onUploadProgress,
      }
    );
    return response.data;
  },

  /**
   * Update an existing document with multipart/form-data.
   */
  updateDocument: async (
    id: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<{ message: string; document: Document }> => {
    const response = await api.put<{ message: string; document: Document }>(
      `/documents/${id}`,
      formData,
      {
        onUploadProgress,
      }
    );
    return response.data;
  },

  /**
   * Renew a document with multipart/form-data, archiving the previous version.
   */
  renewDocument: async (
    id: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: { loaded: number; total?: number }) => void
  ): Promise<{ message: string; document: Document; previousVersionNumber: number }> => {
    const response = await api.post<{
      message: string;
      document: Document;
      previousVersionNumber: number;
    }>(`/documents/${id}/renew`, formData, {
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Toggle archive state (archive/unarchive) via PATCH.
   */
  toggleArchive: async (id: string): Promise<{ message: string; document: Document }> => {
    const response = await api.patch<{ message: string; document: Document }>(
      `/documents/${id}/archive`
    );
    return response.data;
  },

  /**
   * Permanently delete a document (Admin only).
   */
  deleteDocument: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/documents/${id}`);
    return response.data;
  },

  /**
   * Download authenticated attachment as a Blob and trigger save dialog.
   */
  downloadAttachment: async (url: string, filename: string): Promise<void> => {
    const normalizedUrl = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url;
    const response = await api.get(normalizedUrl, {
      responseType: 'blob',
    });

    const headerType = response.headers['content-type'];
    const mimeType = typeof headerType === 'string' ? headerType : 'application/octet-stream';
    const blob = new Blob([response.data], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'documento';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },

  /**
   * Open authenticated attachment preview in a new window/tab.
   */
  previewAttachment: async (url: string): Promise<void> => {
    const normalizedUrl = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url;
    const response = await api.get(normalizedUrl, {
      responseType: 'blob',
    });

    const headerType = response.headers['content-type'];
    const mimeType = typeof headerType === 'string' ? headerType : 'application/pdf';
    const blob = new Blob([response.data], { type: mimeType });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
  },
};
