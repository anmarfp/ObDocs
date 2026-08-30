import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, UserPlus, Edit2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { Role } from '@/features/documents/types/document.types';
import { UserItem } from '../types/user.types';
import { userService } from '../services/userService';

const userFormSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().trim().email('E-mail em formato inválido.'),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'OPERATIONAL'] as const),
});

type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  role: 'ADMIN' | 'OPERATIONAL';
};

interface UserFormModalProps {
  isOpen: boolean;
  userToEdit: UserItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (title: string, message?: string) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  userToEdit,
  onClose,
  onSuccess,
  onError,
}) => {
  const isEdit = !!userToEdit;
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'OPERATIONAL',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
      if (userToEdit) {
        reset({
          name: userToEdit.name,
          email: userToEdit.email,
          password: '',
          role: userToEdit.role,
        });
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role: 'OPERATIONAL',
        });
      }
    }
  }, [isOpen, userToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: UserFormValues) => {
    setValidationError(null);

    // If create mode, password is required with min length 6
    if (!isEdit) {
      if (!values.password || values.password.length < 6) {
        setValidationError('A senha provisória deve conter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (isEdit && userToEdit) {
        const res = await userService.updateUser(userToEdit.id, {
          name: values.name,
          email: values.email,
          role: values.role as Role,
        });
        onSuccess(res.message || 'Usuário atualizado com sucesso.');
        onClose();
      } else {
        const res = await userService.createUser({
          name: values.name,
          email: values.email,
          password: values.password!,
          role: values.role as Role,
        });
        onSuccess(res.message || 'Usuário cadastrado com sucesso.');
        onClose();
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      const errorData = axiosError.response?.data;

      if (errorData?.error === 'EMAIL_ALREADY_EXISTS') {
        onError('E-mail Duplicado', 'Já existe um usuário cadastrado com este endereço de e-mail.');
      } else if (errorData?.error === 'USER_NOT_FOUND') {
        onError('Usuário Não Encontrado', 'O usuário solicitado não foi localizado.');
      } else {
        onError(
          isEdit ? 'Falha ao Atualizar' : 'Falha ao Cadastrar',
          errorData?.message || 'Ocorreu um erro ao salvar o usuário. Tente novamente.'
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
      aria-labelledby="user-form-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center">
              {isEdit ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 id="user-form-title" className="text-lg font-bold text-navy-950">
                {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit ? 'Atualize as permissões e dados cadastrais.' : 'Cadastre um novo membro no sistema.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
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
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Carlos Silva"
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
              E-mail de Acesso <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="Ex: carlos.silva@empresa.com"
              disabled={isSubmitting}
              {...register('email')}
              className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition ${
                errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Senha Provisória <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="Mínimo de 6 caracteres"
                disabled={isSubmitting}
                {...register('password')}
                className={`w-full px-3.5 py-2 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition ${
                  errors.password || validationError ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200'
                }`}
              />
              {(errors.password || validationError) && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {errors.password?.message || validationError}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Papel / Permissão (RBAC) <span className="text-red-500">*</span>
            </label>
            <select
              disabled={isSubmitting}
              {...register('role')}
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition text-slate-700"
            >
              <option value="OPERATIONAL">OPERACIONAL (Visualiza e renova documentos)</option>
              <option value="ADMIN">ADMINISTRADOR (Acesso irrestrito a configurações, usuários e auditoria)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
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
              ) : isEdit ? (
                'Atualizar Dados'
              ) : (
                'Criar Usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
