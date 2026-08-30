import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { auditService } from '@/features/audit/services/auditService';
import { AuditLogItem, AuditLogsResponse } from '@/features/audit/types/audit.types';
import { AuditAction } from '@/features/documents/types/document.types';
import { AuditDetailModal } from '@/features/audit/components/AuditDetailModal';
import { formatDateTime } from '@/features/documents/utils/dateHelper';
import { ToastContainer } from '@/features/documents/components/Toast';
import { useToast } from '@/features/documents/hooks/useToast';

const AUDIT_ACTIONS: AuditAction[] = [
  'CREATE',
  'UPDATE',
  'ARCHIVE',
  'UNARCHIVE',
  'DELETE',
  'RENEW',
];

export const AuditPage: React.FC = () => {
  const { toasts, removeToast, toastError } = useToast();

  const [logsData, setLogsData] = useState<AuditLogsResponse | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [action, setAction] = useState<AuditAction | ''>('');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Debounced search for author
  const [authorInput, setAuthorInput] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(authorInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [authorInput]);

  const fetchLogs = useCallback(
    async (targetPage = page) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await auditService.listLogs({
          page: targetPage,
          limit,
          action: action || undefined,
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        setLogsData(data);
        setPage(targetPage);
      } catch (err: any) {
        console.error('Falha ao carregar trilha de auditoria:', err);
        setLoadError('Não foi possível buscar os registros de auditoria.');
        toastError('Erro na Auditoria', 'Falha ao conectar com o servidor.');
      } finally {
        setIsLoading(false);
      }
    },
    [page, limit, action, search, startDate, endDate, toastError]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [action, search, startDate, endDate]);

  const handleClearFilters = () => {
    setAuthorInput('');
    setSearch('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = !!authorInput || !!action || !!startDate || !!endDate;

  const actionBadges: Record<string, { bg: string; text: string }> = {
    CREATE: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800' },
    ARCHIVE: { bg: 'bg-amber-100', text: 'text-amber-800' },
    UNARCHIVE: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    DELETE: { bg: 'bg-red-100', text: 'text-red-800' },
    RENEW: { bg: 'bg-purple-100', text: 'text-purple-800' },
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Trilha de Auditoria</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-900 border border-navy-400">
              Admin Exclusivo
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Registro imutável e cronológico de todas as modificações, renovações e exclusões no sistema (RN-008).
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => fetchLogs(page)}
            disabled={isLoading}
            className="btn-secondary"
            title="Atualizar listagem de auditoria"
          >
            <RefreshCw className={`w-4 h-4 mr-2 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Author Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={authorInput}
              onChange={(e) => setAuthorInput(e.target.value)}
              placeholder="Buscar por autor..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
            />
            {authorInput && (
              <button
                type="button"
                onClick={() => setAuthorInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value as AuditAction | '');
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition text-slate-700"
            >
              <option value="">Todas as Ações</option>
              {AUDIT_ACTIONS.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
              title="Data inicial"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
              title="Data final"
            />
          </div>
        </div>

        {/* Clear Filters & Count */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Total de registros: <strong>{logsData?.total || 0}</strong>
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center text-xs font-semibold text-navy-700 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchLogs(page)}
            className="font-bold underline hover:text-red-950 ml-2"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-navy-600" />
            <p className="text-xs">Carregando trilha de auditoria...</p>
          </div>
        ) : !logsData || logsData.logs.length === 0 ? (
          <div className="p-12 text-center bg-slate-50">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-navy-950">Nenhum log encontrado</h3>
            <p className="text-xs text-slate-500 mt-1">Nenhum evento registrado com os filtros informados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 sm:px-6">Ação</th>
                  <th scope="col" className="py-3.5 px-4">Autor</th>
                  <th scope="col" className="py-3.5 px-4">Documento / Contexto</th>
                  <th scope="col" className="py-3.5 px-4">Data e Hora</th>
                  <th scope="col" className="py-3.5 px-4 text-right pr-6">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {logsData.logs.map((log: AuditLogItem) => {
                  const badgeStyle = actionBadges[log.action] || { bg: 'bg-slate-100', text: 'text-slate-800' };

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      {/* Action Badge */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${badgeStyle.bg} ${badgeStyle.text}`}>
                            {log.action}
                          </span>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                        <div>
                          <span>{log.userName}</span>
                          {log.user?.role && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {log.user.role}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Document Title / Context */}
                      <td className="py-3.5 px-4">
                        <div>
                          {log.document ? (
                            <div className="flex items-center space-x-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="font-semibold text-slate-800 truncate max-w-xs block">
                                {log.document.title}
                              </span>
                              {log.document.isArchived && (
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                                  Arquivado
                                </span>
                              )}
                            </div>
                          ) : log.documentId ? (
                            <span className="font-mono text-[11px] text-slate-500">Doc ID: {log.documentId}</span>
                          ) : (
                            <span className="text-slate-400 italic">Documento Excluído / Global</span>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        <div>{formatDateTime(log.timestamp)}</div>
                      </td>

                      {/* Action View */}
                      <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition"
                            title="Ver Diff Completo"
                            aria-label="Ver detalhes do log de auditoria"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination Bar */}
        {logsData && logsData.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Página <strong>{page}</strong> de <strong>{logsData.totalPages}</strong> ({logsData.total} registros)
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => fetchLogs(page - 1)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= logsData.totalPages || isLoading}
                onClick={() => fetchLogs(page + 1)}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        isOpen={!!selectedLog}
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};

export default AuditPage;
