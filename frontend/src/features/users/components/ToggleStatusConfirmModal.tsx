import React, { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { AxiosError } from 'axios';
import { UserItem } from '../types/user.types';
import { userService } from '../services/userService';

interface ToggleStatusConfirmModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message?: string) => void;
}

export const ToggleStatusConfirmModal: React.FC<ToggleStatusConfirmModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  onError,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const isActivating = !user.isActive;

  const handleToggle = async () => {
    setIsSubmitting(true);
    try {
      const res = await userService.toggleStatus(user.id);
      onSuccess(res.message || `Usuário ${isActivating ? 'ativado' : 'inativado'} com sucesso.`);
      onClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      const errorData = axiosError.response?.data;

      if (errorData?.error === 'CANNOT_DEACTIVATE_SELF') {
        onError('Ação Bloqueada', 'Você não pode inativar ou alterar o status do seu próprio usuário.');
      } else {
        onError(
          'Falha na Operação',
          errorData?.message || 'Não foi possível alterar o status do usuário.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="toggle-status-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isActivating ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
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
          <h3 id="toggle-status-title" className="text-base font-bold text-navy-950">
            {isActivating ? 'Ativar Usuário?' : 'Inativar Usuário?'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isActivating
              ? `O usuário ${user.name} (${user.email}) poderá voltar a autenticar e utilizar o DocsObs.`
              : `O usuário ${user.name} (${user.email}) não conseguirá mais realizar login no sistema até ser reativado.`}
          </p>
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
            onClick={handleToggle}
            disabled={isSubmitting}
            className={`inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition disabled:opacity-50 min-w-[100px] ${
              isActivating
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Processando...
              </>
            ) : isActivating ? (
              'Confirmar Ativação'
            ) : (
              'Confirmar Inativação'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToggleStatusConfirmModal;
