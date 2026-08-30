import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  RefreshCw,
  TrendingUp,
  FileText,
  Archive,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/features/dashboard/services/dashboardService';
import { DashboardMetrics } from '@/features/dashboard/types/dashboard.types';
import { ReportExportModal } from '@/features/reports/components/ReportExportModal';
import { ToastContainer } from '@/features/documents/components/Toast';
import { useToast } from '@/features/documents/hooks/useToast';
import { formatDate } from '@/features/documents/utils/dateHelper';
import DocumentStatusBadge from '@/features/documents/components/DocumentStatusBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { toasts, removeToast, toastSuccess, toastError } = useToast();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await dashboardService.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error('Falha ao carregar métricas do dashboard:', err);
      setLoadError('Não foi possível carregar as métricas do dashboard. Tente novamente.');
      toastError('Erro no Dashboard', 'Falha ao buscar dados analíticos do servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Colors for Status Matrix Cards and Charts
  const statusCards = [
    {
      title: 'Vencido',
      count: metrics?.statusCounts.EXPIRED || 0,
      tag: 'Ação Imediata',
      desc: 'Prazo ultrapassado',
      icon: AlertTriangle,
      borderClass: 'border-red-200 hover:border-red-400',
      bgClass: 'bg-red-50/50',
      badgeClass: 'bg-red-100 text-red-700',
      countColor: 'text-red-600',
      dotColor: 'bg-red-500',
    },
    {
      title: 'Alerta Crítico',
      count: metrics?.statusCounts.CRITICAL || 0,
      tag: 'Próximo Venc.',
      desc: 'Dentro do prazo de alerta',
      icon: Clock,
      borderClass: 'border-amber-200 hover:border-amber-400',
      bgClass: 'bg-amber-50/50',
      badgeClass: 'bg-amber-100 text-amber-800',
      countColor: 'text-amber-600',
      dotColor: 'bg-amber-500',
    },
    {
      title: 'Em Renovação',
      count: metrics?.statusCounts.RENEWAL_IN_PROGRESS || 0,
      tag: 'Protocolado',
      desc: 'Em trâmite junto ao órgão',
      icon: RefreshCw,
      borderClass: 'border-navy-400/40 hover:border-navy-600',
      bgClass: 'bg-navy-50/60',
      badgeClass: 'bg-navy-100 text-navy-900',
      countColor: 'text-navy-700',
      dotColor: 'bg-navy-600',
    },
    {
      title: 'Regular / Em Dia',
      count: metrics?.statusCounts.REGULAR || 0,
      tag: 'Vigente',
      desc: 'Vencimento regularizado',
      icon: CheckCircle2,
      borderClass: 'border-emerald-200 hover:border-emerald-400',
      bgClass: 'bg-emerald-50/50',
      badgeClass: 'bg-emerald-100 text-emerald-800',
      countColor: 'text-emerald-600',
      dotColor: 'bg-emerald-500',
    },
    {
      title: 'Indeterminado',
      count: metrics?.statusCounts.INDETERMINATE || 0,
      tag: 'Permanente',
      desc: 'Sem prazo de expiração',
      icon: HelpCircle,
      borderClass: 'border-slate-200 hover:border-slate-400',
      bgClass: 'bg-slate-50',
      badgeClass: 'bg-slate-200 text-slate-700',
      countColor: 'text-slate-600',
      dotColor: 'bg-slate-400',
    },
  ];

  // Prepare chart data for status distribution
  const statusPieData = metrics
    ? [
        { name: 'Vencido', value: metrics.statusCounts.EXPIRED, color: '#ef4444' },
        { name: 'Crítico', value: metrics.statusCounts.CRITICAL, color: '#f59e0b' },
        { name: 'Em Renovação', value: metrics.statusCounts.RENEWAL_IN_PROGRESS, color: '#0284c7' },
        { name: 'Regular', value: metrics.statusCounts.REGULAR, color: '#10b981' },
        { name: 'Indeterminado', value: metrics.statusCounts.INDETERMINATE, color: '#94a3b8' },
      ].filter((item) => item.value > 0)
    : [];

  // Prepare chart data for category expirations in next 30 days
  const categoryBarData = metrics?.byCategory
    ? metrics.byCategory.map((c) => ({
        name: c.categoryName,
        vencimentos: c.count,
        fill: c.colorHex || '#3b82f6',
      }))
    : [];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight">
            Painel Executivo & Indicadores
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Olá, <span className="font-semibold text-navy-800">{user?.name}</span>. Acompanhe a matriz de conformidade e status dos documentos em tempo real.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={fetchMetrics}
            disabled={isLoading}
            className="btn-secondary"
            title="Atualizar dados analíticos"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="btn-secondary"
          >
            <Download className="w-4 h-4 mr-2 text-slate-500" />
            Exportar Relatório
          </button>
          <Link to="/documentos" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Gerenciar Documentos
          </Link>
        </div>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={fetchMetrics}
            className="font-bold underline hover:text-red-950 ml-2"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Top Highlights: Total Active, Compliance Rate, and (Admin only) Total Archived */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Documentos Ativos
            </span>
            <div className="text-3xl font-black text-navy-950 mt-1">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                metrics?.totalActive || 0
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total sob monitoramento vigente</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Taxa de Conformidade
            </span>
            <div className="text-3xl font-black text-emerald-600 mt-1 flex items-baseline">
              {isLoading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
              ) : (
                <>
                  {metrics?.complianceRate ?? 100}%
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">Documentos com vigência em dia</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {isAdmin ? (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-card flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Documentos Arquivados
              </span>
              <div className="text-3xl font-black text-slate-700 mt-1">
                {isLoading ? (
                  <div className="h-8 w-16 bg-slate-200 animate-pulse rounded" />
                ) : (
                  metrics?.totalArchived || 0
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Visualização restrita a administradores</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
              <Archive className="w-6 h-6" />
            </div>
          </div>
        ) : (
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-card flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Status Operacional
              </span>
              <div className="text-base font-bold text-navy-900 mt-2 flex items-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-1.5" />
                Monitoramento Ativo
              </div>
              <p className="text-xs text-slate-500 mt-1">Perfil de Acesso: Operacional</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Status Matrix Grid (5 Cards) */}
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
                {isLoading ? (
                  <div className="h-8 w-12 bg-slate-200 animate-pulse rounded" />
                ) : (
                  card.count
                )}
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

      {/* Charts Section: Status Distribution & Next 30 Days by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Status Distribution Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 flex items-center">
                <PieIcon className="w-4 h-4 text-navy-600 mr-2" />
                Distribuição dos Documentos Ativos por Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Visão percentual da base total ({metrics?.totalActive || 0} documentos)
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando gráfico...
              </div>
            ) : statusPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Nenhum documento ativo cadastrado para exibição no gráfico.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [`${val ?? 0} documento(s)`, String(name || '')]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 text-xs">
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Upcoming Expirations by Category (Next 30 Days) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 flex items-center">
                <BarChart3 className="w-4 h-4 text-navy-600 mr-2" />
                Próximos Vencimentos por Categoria (30 dias)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Documentos que expiram dentro da janela dos próximos 30 dias
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex-1">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Carregando gráfico...
              </div>
            ) : categoryBarData.length === 0 || categoryBarData.every((c) => c.vencimentos === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-70" />
                <p>Nenhum vencimento previsto para os próximos 30 dias.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <RechartsTooltip
                    formatter={(val: any) => [`${val ?? 0} documento(s) vencendo`, 'Quantidade']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="vencimentos" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            * Contabiliza apenas documentos com vencimento entre hoje e os próximos 30 dias.
          </div>
        </div>
      </div>

      {/* Quick Overview: Urgent & Upcoming Documents Watch List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-navy-950 flex items-center">
                <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                Próximos Vencimentos e Alertas Críticos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Documentos requerendo acompanhamento ou protocolo de renovação
              </p>
            </div>
            <Link to="/documentos" className="text-xs font-semibold text-navy-600 hover:underline">
              Ver todos os documentos &rarr;
            </Link>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-navy-600" />
              Carregando documentos pendentes...
            </div>
          ) : !metrics?.upcomingExpirations || metrics.upcomingExpirations.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-700">Tudo em dia!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Não há documentos com vencimento iminente cadastrados.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.upcomingExpirations.slice(0, 5).map((doc) => (
                <div key={doc.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to="/documentos"
                        className="text-sm font-semibold text-slate-800 hover:text-navy-700 truncate block"
                      >
                        {doc.title}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">
                        {doc.category?.name || 'Sem Categoria'} &bull; {doc.issuingBody || 'Órgão não especificado'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <DocumentStatusBadge status={doc.status} />
                    <span className="block text-[11px] text-slate-500 font-medium">
                      Vence em: {formatDate(doc.expirationDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick System Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
          <h2 className="text-base font-bold text-navy-950 flex items-center">
            <Shield className="w-4 h-4 text-navy-600 mr-2" />
            Informações do Sistema
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Sessão Ativa:</span>
              <span className="font-bold text-navy-950 truncate max-w-[150px]">{user?.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Perfil RBAC:</span>
              <span className="font-bold text-navy-600 uppercase">{user?.role}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-slate-600">Sincronização Google:</span>
              <span className="font-semibold text-sky-700 flex items-center">
                <CalendarIcon className="w-3.5 h-3.5 mr-1" /> Real via OAuth
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

      {/* Report Export Modal */}
      <ReportExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onError={toastError}
        onSuccess={toastSuccess}
      />
    </div>
  );
};

export default DashboardPage;
