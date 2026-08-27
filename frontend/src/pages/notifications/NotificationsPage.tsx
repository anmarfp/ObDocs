import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Central de Notificações</h1>
          <p className="text-sm text-slate-500 mt-1">
            Histórico completo de alertas disparados por e-mail e notificações no sistema.
          </p>
        </div>

        <button className="btn-secondary">
          <CheckCheck className="w-4 h-4 mr-2 text-slate-500" />
          Marcar todas como lidas
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-navy-50 text-navy-600 flex items-center justify-center mb-4">
          <Bell className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-navy-950">Módulo de Notificações</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
          Estrutura pronta para a Fase 2 (Fila de notificações, histórico de disparos e regras de alerta).
        </p>
      </div>
    </div>
  );
};

export default NotificationsPage;
