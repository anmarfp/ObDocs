import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, KeyRound } from 'lucide-react';
import { AxiosError } from 'axios';
import { UserItem } from '../types/user.types';
import { userService } from '../services/userService';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(6, 'A confirmação deve ter pelo menos 6 caracteres.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas informadas não conferem.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordModalProps {
  isOpen: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message?: string) => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  user,
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
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  if (!isOpen || !user) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await userService.resetPassword(user.id, {
        password: values.password,
      });
      onSuccess(res.message || 'Senha redefinida com sucesso.');
      handleClose();
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      onError(
        'Falha ao Redefinir Senha',
        axiosError.response?.data?.message || 'Não foi possível atualizar a senha deste usuário.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 id="reset-password-title" className="text-lg font-bold text-navy-950">
                Redefinir Senha
              </h2>
              <p className="text-xs text-slate-500">Usuário: {user.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nova Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Mínimo de 6 caracteres"
              disabled={isSubmitting}
              {...register('password')}
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition ${
                errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
              }`}
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Confirmar Nova Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              placeholder="Repita a nova senha"
              disabled={isSubmitting}
              {...register('confirmPassword')}
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition ${
                errors.confirmPassword ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.confirmPassword.message}</p>
            )}
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
              className="btn-primary text-xs min-w-[130px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
