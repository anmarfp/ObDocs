import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { AxiosError } from 'axios';
import { DocumentCategory } from '@/features/documents/types/document.types';
import { categoryService } from '@/features/documents/services/categoryService';

interface DeleteCategoryModalProps {
  isOpen: boolean;
  category: DocumentCategory | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message?: string) => void;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !category) return null;

  const documentCount = category.documentCount ?? 0;

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await categoryService.deleteCategory(category.id);
      onSuccess(res.message || `A categoria "${category.name}" foi removida com sucesso.`);
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      const errorData = axiosError.response?.data;

      if (errorData?.error === 'DEFAULT_CATEGORY_PROTECTED') {
        onError('Categoria Protegida', 'A categoria padrão "Sem Categoria" não pode ser excluída.');
      } else {
        onError(
          'Falha ao Excluir Categoria',
          errorData?.message || 'Não foi possível excluir a categoria.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-category-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 id="delete-category-title" className="text-base font-bold text-navy-950">
            Excluir Categoria?
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Você realmente deseja excluir a categoria <strong>&quot;{category.name}&quot;</strong>?
          </p>
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-800">
              {documentCount} documento(s) serão afetados
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Esses documentos serão classificados como &quot;Sem Categoria&quot;.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn-secondary text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition disabled:opacity-50 min-w-[130px] bg-red-600 hover:bg-red-700 active:bg-red-800"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Confirmar Exclusão'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteCategoryModal;
