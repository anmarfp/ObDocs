import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  User as UserIcon,
  Calendar,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const statusCards = [
    {
      title: 'Vencidos',
      count: '0',
      description: 'Documentos expirados',
      color: 'border-status-expired/40 bg-status-expired/10 text-status-expired',
      icon: AlertTriangle,
    },
    {
      title: 'Críticos (≤ 15d)',
      count: '0',
      description: 'Atenção imediata',
      color: 'border-status-critical/40 bg-status-critical/10 text-status-critical',
      icon: Clock,
    },
    {
      title: 'Em Renovação (16-30d)',
      count: '0',
      description: 'Processo iniciado',
      color: 'border-status-renewal/40 bg-status-renewal/10 text-status-renewal',
      icon: Calendar,
    },
    {
      title: 'Regulares (> 30d)',
      count: '0',
      description: 'Em dia',
      color: 'border-status-regular/40 bg-status-regular/10 text-status-regular',
      icon: CheckCircle2,
    },
    {
      title: 'Indeterminados',
      count: '0',
      description: 'Sem data de expiração',
      color: 'border-status-indeterminate/40 bg-status-indeterminate/10 text-slate-300',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-navy-card via-navy-card/90 to-navy-blue/20 border border-navy-border/30 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-navy-light">
                Painel Geral
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Olá, {user?.name || 'Usuário'}! 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Bem-vindo ao DocsOb. Acompanhe a saúde dos vencimentos e o status de conformidade da sua organização em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-navy-main/80 border border-navy-border/30 flex items-center gap-2 text-xs font-semibold text-navy-light">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Sessão Autenticada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Cards Grid */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Resumo de Vencimentos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statusCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="p-5 rounded-xl bg-navy-card/60 border border-navy-border/30 shadow-md hover:border-navy-border/60 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-300">{card.title}</span>
                  <div className={`p-2 rounded-lg border ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">{card.count}</div>
                  <p className="text-[11px] text-slate-400 mt-1">{card.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User Information & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-navy-card/50 border border-navy-border/30 p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy-border/20">
            <FileText className="h-5 w-5 text-navy-blue" />
            <h3 className="font-bold text-white text-base">Atividades Recentes</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
            <Clock className="h-10 w-10 text-navy-border/40 mb-2" />
            <p className="text-sm font-medium">Nenhuma atividade recente registrada.</p>
            <p className="text-xs text-slate-500 mt-0.5">Os registros aparecerão aqui à medida que os documentos forem gerenciados.</p>
          </div>
        </div>

        <div className="rounded-2xl bg-navy-card/50 border border-navy-border/30 p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-navy-border/20">
            <UserIcon className="h-5 w-5 text-navy-light" />
            <h3 className="font-bold text-white text-base">Perfil do Usuário</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Nome</span>
              <span className="font-semibold text-white">{user?.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">E-mail</span>
              <span className="text-slate-300">{user?.email}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Nível de Permissão</span>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-bold bg-navy-blue/30 text-navy-light border border-navy-border/40">
                {user?.role === 'ADMIN' ? 'Administrador do Sistema' : 'Operacional'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Status da Conta</span>
              <span className="text-emerald-400 font-semibold text-xs inline-flex items-center gap-1 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Ativa e Regular
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
