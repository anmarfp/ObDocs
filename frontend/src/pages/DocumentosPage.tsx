import React from 'react';
import { FileText, Plus, Search, Filter } from 'lucide-react';

export const DocumentosPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-navy-blue" />
            Gestão de Documentos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cadastre, pesquise e acompanhe os vencimentos de documentos
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-blue hover:bg-navy-blue/90 text-white font-medium text-sm shadow-md transition-colors">
          <Plus className="h-4 w-4" />
          Novo Documento
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, emissor ou observações..."
            className="w-full pl-10 pr-4 py-2 bg-navy-card/60 border border-navy-border/30 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-blue"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-card/60 border border-navy-border/30 text-slate-300 hover:text-white text-sm font-medium transition-colors">
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      <div className="rounded-xl bg-navy-card/40 border border-navy-border/20 p-12 text-center text-slate-400">
        <FileText className="h-12 w-12 text-navy-border/30 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-200">Módulo de Documentos em Preparação</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          A listagem e gerenciamento completo de documentos será conectado nas próximas fases.
        </p>
      </div>
    </div>
  );
};
