import React from 'react';
import { Settings, Building } from 'lucide-react';

export const ConfiguracoesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-navy-blue" />
            Configurações da Empresa
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Parâmetros corporativos, notificações por e-mail e integração Google Agenda
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-navy-card/40 border border-navy-border/20 p-12 text-center text-slate-400">
        <Building className="h-12 w-12 text-navy-border/30 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-200">Parâmetros do Sistema</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Configurações globais de tolerância, canais de notificação e dados da organização.
        </p>
      </div>
    </div>
  );
};
