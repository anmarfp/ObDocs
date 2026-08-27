import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarioPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-navy-blue" />
            Calendário de Vencimentos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualize os vencimentos distribuídos ao longo dos meses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-navy-card/60 border border-navy-border/30 text-slate-300 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-navy-card/60 border border-navy-border/30 text-slate-300 text-xs font-semibold hover:text-white transition-colors">
            Hoje
          </button>
          <button className="p-2 rounded-lg bg-navy-card/60 border border-navy-border/30 text-slate-300 hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-navy-card/40 border border-navy-border/20 p-12 text-center text-slate-400">
        <CalendarIcon className="h-12 w-12 text-navy-border/30 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-200">Visão de Calendário Interativo</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Grade mensal e integração com Google Calendar serão integradas na Fase 3.
        </p>
      </div>
    </div>
  );
};
