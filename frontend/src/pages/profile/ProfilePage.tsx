import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Shield, Calendar, KeyRound } from 'lucide-react';
import { ResetPasswordModal } from '@/features/users/components/ResetPasswordModal';
import { ToastContainer } from '@/features/documents/components/Toast';
import { useToast } from '@/features/documents/hooks/useToast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toasts, removeToast, toastSuccess, toastError } = useToast();
  const [resetModalOpen, setResetModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <div>
        <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Meu Perfil</h1>
        <p className="text-sm text-slate-500 mt-1">
          Informações da conta e detalhes de autenticação no sistema.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 md:p-8 space-y-6">
        <div className="flex items-center space-x-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 text-navy-100 flex items-center justify-center text-xl font-bold shadow-md">
            {user?.name?.substring(0, 2).toUpperCase() || 'DO'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-950">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  user?.role === 'ADMIN'
                    ? 'bg-navy-100 text-navy-900 border border-navy-400'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {user?.role === 'ADMIN' ? 'Administrador' : 'Operacional'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <User className="w-5 h-5 text-navy-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Nome Completo</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{user?.name}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <Mail className="w-5 h-5 text-navy-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">E-mail Cadastrado</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <Shield className="w-5 h-5 text-navy-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Papel no Sistema (RBAC)</p>
              <p className="text-sm font-semibold text-navy-700 mt-0.5">{user?.role}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-navy-600 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Status da Conta</p>
              <p className="text-sm font-semibold text-emerald-600 mt-0.5">Ativo no Sistema</p>
            </div>
          </div>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setResetModalOpen(true)}
            >
              <KeyRound className="w-4 h-4 mr-2 text-slate-500" />
              Alterar Minha Senha
            </button>
          </div>
        )}
      </div>

      {user && (
        <ResetPasswordModal
          isOpen={resetModalOpen}
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: true,
          }}
          onClose={() => setResetModalOpen(false)}
          onSuccess={(msg) => toastSuccess('Sucesso', msg)}
          onError={toastError}
        />
      )}
    </div>
  );
};

export default ProfilePage;
