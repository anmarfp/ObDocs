import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  RefreshCw,
  Edit2,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/features/users/services/userService';
import { UserItem } from '@/features/users/types/user.types';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import { ResetPasswordModal } from '@/features/users/components/ResetPasswordModal';
import { ToggleStatusConfirmModal } from '@/features/users/components/ToggleStatusConfirmModal';
import { formatDate } from '@/features/documents/utils/dateHelper';
import { ToastContainer } from '@/features/documents/components/Toast';
import { useToast } from '@/features/documents/hooks/useToast';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { toasts, removeToast, toastSuccess, toastError } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<UserItem | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Falha ao carregar usuários:', err);
      setLoadError('Não foi possível carregar a lista de usuários.');
      toastError('Erro de Usuários', 'Falha ao buscar usuários no servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
    );
  }, [users, search]);

  const handleOpenCreate = () => {
    setUserToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setUserToEdit(user);
    setIsFormModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Usuários & Papéis (RBAC)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-900 border border-navy-400">
              Admin Exclusivo
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Controle de acesso, perfis de permissão (ADMIN / OPERATIONAL) e ativação/inativação de contas.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="btn-secondary"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="btn-primary"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Search & Overview Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou perfil..."
            className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center space-x-3 w-full sm:w-auto justify-end">
          <span>
            Total: <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> usuário(s)
          </span>
        </div>
      </div>

      {/* Load error message if any */}
      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchUsers}
            className="font-bold underline hover:text-red-950 ml-2"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-navy-600" />
            <p className="text-xs">Carregando usuários cadastrados...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-slate-50">
            <UsersIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-navy-950">Nenhum usuário encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">
              Nenhum usuário corresponde aos critérios de busca informados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Usuário</th>
                  <th scope="col" className="py-3.5 px-4">E-mail</th>
                  <th scope="col" className="py-3.5 px-4">Papel (RBAC)</th>
                  <th scope="col" className="py-3.5 px-4">Status</th>
                  <th scope="col" className="py-3.5 px-4 hidden md:table-cell">Cadastrado em</th>
                  <th scope="col" className="py-3.5 px-4 text-right pr-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredUsers.map((userItem) => {
                  const isSelf = currentUser?.id === userItem.id;
                  const isAdminRole = userItem.role === 'ADMIN';

                  return (
                    <tr
                      key={userItem.id}
                      className={`hover:bg-slate-50/80 transition ${
                        !userItem.isActive ? 'bg-slate-50/40 opacity-70' : ''
                      }`}
                    >
                      {/* Name & Badge */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {userItem.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{userItem.name}</span>
                            {isSelf && (
                              <span className="inline-flex text-[10px] text-navy-700 font-semibold bg-navy-50 px-1.5 py-0.2 rounded border border-navy-200">
                                Sua Conta Atual
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div>{userItem.email}</div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                              isAdminRole
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {isAdminRole ? 'ADMIN' : 'OPERATIONAL'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          {userItem.isActive ? (
                            <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-red-600 font-semibold text-[11px]">
                              <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" /> Inativo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 hidden md:table-cell">
                        <div>{formatDate(userItem.createdAt)}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(userItem)}
                            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition"
                            title="Editar Usuário"
                            aria-label="Editar usuário"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => setUserToResetPassword(userItem)}
                            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition"
                            title="Redefinir Senha"
                            aria-label="Redefinir senha"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setUserToToggleStatus(userItem)}
                            className={`p-1.5 rounded-lg transition ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed text-slate-300'
                                : userItem.isActive
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              isSelf
                                ? 'Você não pode alterar o status da sua própria conta'
                                : userItem.isActive
                                ? 'Inativar Usuário'
                                : 'Ativar Usuário'
                            }
                            aria-label={userItem.isActive ? 'Inativar usuário' : 'Ativar usuário'}
                          >
                            {userItem.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Form Modal (Create / Edit) */}
      <UserFormModal
        isOpen={isFormModalOpen}
        userToEdit={userToEdit}
        onClose={() => {
          setIsFormModalOpen(false);
          setUserToEdit(null);
        }}
        onSuccess={(msg) => {
          toastSuccess('Sucesso', msg);
          fetchUsers();
        }}
        onError={toastError}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!userToResetPassword}
        user={userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
        onSuccess={(msg) => {
          toastSuccess('Sucesso', msg);
        }}
        onError={toastError}
      />

      {/* Toggle Status Modal */}
      <ToggleStatusConfirmModal
        isOpen={!!userToToggleStatus}
        user={userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onSuccess={(msg) => {
          toastSuccess('Sucesso', msg);
          fetchUsers();
        }}
        onError={toastError}
      />
    </div>
  );
};

export default UsersPage;
