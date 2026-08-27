import React from 'react';
import { Settings, Save } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Configurações do Sistema</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-900 border border-navy-400">
              Admin Exclusivo
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Parâmetros globais, modo de notificação da empresa (RN-004) e categorias de documentos.
          </p>
        </div>

        <button className="btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-navy-50 text-navy-600 flex items-center justify-center mb-4">
          <Settings className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">Módulo de Configurações da Empresa</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
          Estrutura pronta para a Fase 2 (Configuração de notification_mode: ALL_ADMINS vs ONLY_RESPONSIBLE, CRUD de categorias).
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
