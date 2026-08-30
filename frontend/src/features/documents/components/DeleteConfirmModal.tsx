import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { AxiosError } from 'axios';
import { Document } from '../types/document.types';
import { documentService } from '../services/documentService';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  document: Document | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message?: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  document,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !document) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await documentService.deleteDocument(document.id);
      onSuccess(res.message || 'Documento excluído permanentemente com sucesso.');
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      onError(
        'Falha ao Excluir',
        axiosError.response?.data?.message || 'Não foi possível excluir o documento. Tente novamente.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              aria-label="Cancelar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h3 id="delete-modal-title" className="text-lg font-bold text-navy-950">
              Excluir Documento Permanentemente?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Esta ação é <strong>irreversível</strong> (Hard Delete restrito a Administradores).
            </p>
          </div>

          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-900 space-y-1.5">
            <p className="font-semibold text-slate-800 truncate">
              Título: <span className="font-normal">{document.title}</span>
            </p>
            <p>
              Ao confirmar, o registro no banco de dados, todas as versões históricas, logs de sincronização e o anexo físico no servidor serão excluídos definitivamente.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg shadow-sm transition disabled:opacity-50 min-w-[100px]"
          >
            {isDeleting ? (
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
    window.document.body
  );
};

export default DeleteConfirmModal;
