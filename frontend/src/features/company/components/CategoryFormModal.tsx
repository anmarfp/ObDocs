import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Tag } from 'lucide-react';
import { AxiosError } from 'axios';
import { categoryService } from '@/features/documents/services/categoryService';

const categorySchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  colorHex: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Cor inválida (formato hex #RGB ou #RRGGBB).'),
  description: z.string().trim().optional(),
});

type CategoryFormValues = {
  name: string;
  colorHex: string;
  description?: string;
};

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message?: string) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      colorHex: '#3b82f6',
      description: '',
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      await categoryService.createCategory({
        name: values.name,
        colorHex: values.colorHex,
        description: values.description || undefined,
      });
      onSuccess('Categoria criada com sucesso.');
      handleClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      const errorData = axiosError.response?.data;

      if (errorData?.error === 'CATEGORY_ALREADY_EXISTS') {
        onError('Nome Duplicado', 'Já existe uma categoria cadastrada com este nome.');
      } else {
        onError(
          'Falha ao Criar Categoria',
          errorData?.message || 'Não foi possível cadastrar a nova categoria.'
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
      aria-labelledby="category-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 id="category-modal-title" className="text-lg font-bold text-navy-950">
                Nova Categoria
              </h2>
              <p className="text-xs text-slate-500">Classificação para agrupamento de documentos.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nome da Categoria <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Licenças Ambientais"
              disabled={isSubmitting}
              {...register('name')}
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition ${
                errors.name ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cor de Destaque (Hex) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                disabled={isSubmitting}
                {...register('colorHex')}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                placeholder="#3b82f6"
                disabled={isSubmitting}
                {...register('colorHex')}
                className={`flex-1 px-3.5 py-2 bg-white border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-navy-600 transition ${
                  errors.colorHex ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.colorHex && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.colorHex.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Finalidade desta categoria de documentos..."
              disabled={isSubmitting}
              {...register('description')}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Categoria'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CategoryFormModal;
