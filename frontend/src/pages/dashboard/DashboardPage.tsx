import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  HelpCircle,
  Plus,
  Download,
  Calendar as CalendarIcon,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const statusCards = [
    {
      title: 'Vencido',
      count: 4,
      status: 'expired',
      tag: 'Ação Imediata',
      desc: 'Data ultrapassada',
      icon: AlertTriangle,
      borderClass: 'border-red-200 hover:border-red-400',
      bgClass: 'bg-red-50/50',
      badgeClass: 'bg-red-100 text-red-700',
      countColor: 'text-red-600',
      dotColor: 'bg-red-500',
    },
    {
      title: 'Alerta Crítico',
      count: 7,
      status: 'critical',
      tag: 'Próximo Venc.',
      desc: 'Dentro da antecedência',
      icon: Clock,
      borderClass: 'border-amber-200 hover:border-amber-400',
      bgClass: 'bg-amber-50/50',
      badgeClass: 'bg-amber-100 text-amber-800',
      countColor: 'text-amber-600',
      dotColor: 'bg-amber-500',
    },
    {
      title: 'Em Renovação',
      count: 3,
      status: 'renewal',
      tag: 'Protocolado',
      desc: 'Aguardando emissão',
      icon: Clock,
      borderClass: 'border-navy-400/40 hover:border-navy-600',
      bgClass: 'bg-navy-50/60',
      badgeClass: 'bg-navy-100 text-navy-900',
      countColor: 'text-navy-700',
      dotColor: 'bg-navy-600',
    },
    {
      title: 'Regular / Em Dia',
      count: 42,
      status: 'regular',
      tag: 'Vigente',
      desc: 'Vencimento distante',
      icon: CheckCircle2,
      borderClass: 'border-emerald-200 hover:border-emerald-400',
      bgClass: 'bg-emerald-50/50',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      countColor: 'text-emerald-600',
      dotColor: 'bg-emerald-500',
    },
    {
      title: 'Indeterminado',
      count: 12,
      status: 'indeterminate',
      tag: 'Permanente',
      desc: 'Sem expiração',
      icon: HelpCircle,
      borderClass: 'border-slate-200 hover:border-slate-400',
      bgClass: 'bg-slate-50',
      badgeClass: 'bg-slate-200 text-slate-700',
      countColor: 'text-slate-600',
      dotColor: 'bg-slate-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight">
            Painel de Gestão de Documentos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Olá, <span className="font-semibold text-navy-800">{user?.name}</span>. Visão executiva em tempo real e monitoramento da matriz de vencimentos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => alert('Exportação de relatório em desenvolvimento para Fase 2.')}
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Exportar Relatório
          </button>
          <Link to="/documentos" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Cadastrar Documento
          </Link>
        </div>
      </div>

      {/* Status Matrix Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statusCards.map((card) => (
          <div
            key={card.title}
            className={`p-5 rounded-2xl border ${card.borderClass} ${card.bgClass} bg-white shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${card.dotColor}`} />
                  <span className="text-xs font-bold text-slate-700">{card.title}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeClass}`}>
                  {card.tag}
                </span>
              </div>
              <div className={`text-3xl font-black ${card.countColor} mt-3`}>
                {card.count}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] truncate">{card.desc}</span>
              <Link
                to="/documentos"
                className="font-medium text-navy-600 hover:text-navy-900 inline-flex items-center"
              >
                Ver <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Documents Watch */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 flex items-center">
                <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                Vencimentos Urgentes e Próximos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Documentos requerendo protocolo de renovação imediato</p>
            </div>
            <Link to="/documentos" className="text-xs font-semibold text-navy-600 hover:underline">
              Ver todos &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Certidão Negativa de Débitos Federais</p>
                  <p className="text-xs text-slate-400">Receita Federal &bull; Responsável: Marco Silva</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                  Venceu em 15/08/2026
                </span>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Licença Ambiental de Operação (LAO)</p>
                  <p className="text-xs text-slate-400">SEMAD &bull; Responsável: Carlos Silva</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  Vence em 5 dias (31/08/2026)
                </span>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-navy-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">Alvará Sanitário de Funcionamento</p>
                  <p className="text-xs text-slate-400">Vigilância Sanitária &bull; Em Renovação (Prot. #9812)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-navy-100 text-navy-900 border border-navy-400">
                  Em Renovação
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick System Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-950 flex items-center">
            <Shield className="w-4 h-4 text-navy-600 mr-2" />
            Status do DocsOb
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Sessão Ativa:</span>
              <span className="font-bold text-navy-950">{user?.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Perfil RBAC:</span>
              <span className="font-bold text-navy-600 uppercase">{user?.role}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Sincronização Google:</span>
              <span className="font-semibold text-emerald-600 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ativo
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Link
              to="/calendario"
              className="w-full py-2.5 px-3 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-900 text-xs font-bold flex items-center justify-center transition"
            >
              <CalendarIcon className="w-4 h-4 mr-2 text-navy-600" />
              Abrir Calendário de Prazos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
