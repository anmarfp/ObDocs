import React from 'react';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Agenda & Google Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualização cronológica de prazos e sincronização com Google Calendar.
          </p>
        </div>

        <button className="btn-secondary">
          <RefreshCw className="w-4 h-4 mr-2 text-slate-500" />
          Sincronizar Agora
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-navy-50 text-navy-600 flex items-center justify-center mb-4">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">Módulo de Calendário</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
          Estrutura pronta para a Fase 2 (Visualização de vencimentos no calendário e logs de sincronização Google API).
        </p>
      </div>
    </div>
  );
};

export default CalendarPage;
