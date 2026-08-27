import React from 'react';
import { ShieldCheck, Download } from 'lucide-react';

export const AuditoriaPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-navy-blue" />
            Trilha de Auditoria
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Logs imutáveis de ações executadas por usuários no sistema
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-card/60 border border-navy-border/30 text-slate-300 hover:text-white text-sm font-medium transition-colors">
          <Download className="h-4 w-4" />
          Exportar Logs
        </button>
      </div>

      <div className="rounded-xl bg-navy-card/40 border border-navy-border/20 p-12 text-center text-slate-400">
        <ShieldCheck className="h-12 w-12 text-navy-border/30 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-200">Trilha de Auditoria e Conformidade</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Histórico detalhado de inserções, atualizações e exclusões em conformidade com LGPD.
        </p>
      </div>
    </div>
  );
};
