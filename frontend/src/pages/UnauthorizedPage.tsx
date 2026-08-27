import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-navy-card/70 border border-navy-border/30 shadow-2xl backdrop-blur-sm space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Erro 403</span>
          <h1 className="text-2xl font-bold text-white">Acesso Não Autorizado</h1>
          <p className="text-sm text-slate-300">
            Seu perfil atual (<span className="font-semibold text-navy-light">{user?.role || 'OPERACIONAL'}</span>) não possui privilégios suficientes para acessar esta página ou recurso.
          </p>
        </div>

        <div className="pt-4 border-t border-navy-border/20 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-navy-blue hover:bg-navy-blue/90 text-white text-sm font-semibold shadow-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
