import React from 'react';
import { ShieldCheck, Download } from 'lucide-react';

export const AuditPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Trilha de Auditoria</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-900 border border-navy-400">
              Admin Exclusivo
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Registro imutável de todas as ações de criação, renovação, alteração e exclusão (RN-008).
          </p>
        </div>

        <button className="btn-secondary">
          <Download className="w-4 h-4 mr-2 text-slate-500" />
          Exportar Logs
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-navy-50 text-navy-600 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">Módulo de Auditoria (Audit Log)</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
          Estrutura pronta para a Fase 2 (Timeline de eventos com diff JSON formatado e rastreabilidade total).
        </p>
      </div>
    </div>
  );
};

export default AuditPage;
