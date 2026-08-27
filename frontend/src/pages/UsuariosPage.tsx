import React from 'react';
import { Users, UserPlus } from 'lucide-react';

export const UsuariosPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-navy-blue" />
            Gerenciamento de Usuários
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Controle de acessos, perfis (ADMIN / OPERACIONAL) e usuários do sistema
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-blue hover:bg-navy-blue/90 text-white font-medium text-sm shadow-md transition-colors">
          <UserPlus className="h-4 w-4" />
          Convidar Usuário
        </button>
      </div>

      <div className="rounded-xl bg-navy-card/40 border border-navy-border/20 p-12 text-center text-slate-400">
        <Users className="h-12 w-12 text-navy-border/30 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-200">Módulo de Gestão de Usuários (RBAC)</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Criação, edição e inativação de contas com controle de permissões.
        </p>
      </div>
    </div>
  );
};
