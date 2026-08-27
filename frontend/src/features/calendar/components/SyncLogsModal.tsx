import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { calendarService } from '../services/calendarService';
import { SyncLogItem, SyncLogsResponse } from '../types/calendar.types';
import { formatDateTime } from '@/features/documents/utils/dateHelper';

interface SyncLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onError: (title: string, message?: string) => void;
}

export const SyncLogsModal: React.FC<SyncLogsModalProps> = ({
  isOpen,
  onClose,
  onError,
}) => {
  const [logsData, setLogsData] = useState<SyncLogsResponse | null>(null);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = useCallback(
    async (targetPage = 1) => {
      setIsLoading(true);
      try {
        const data = await calendarService.getSyncLogs(targetPage, 10);
        setLogsData(data);
        setPage(targetPage);
      } catch (err: any) {
        console.error('Falha ao carregar logs de sincronização:', err);
        onError('Erro ao Carregar Logs', 'Não foi possível buscar o histórico de sincronizações.');
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  useEffect(() => {
    if (isOpen) {
      fetchLogs(1);
    }
  }, [isOpen, fetchLogs]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-logs-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 id="sync-logs-title" className="text-lg font-bold text-navy-950 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-navy-700" />
              Logs de Sincronização Google Agenda
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditoria de integração e registros de eventos sincronizados (Acesso restrito a Administradores).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-navy-600" />
              <p className="text-xs">Buscando logs de sincronização...</p>
            </div>
          ) : !logsData || logsData.logs.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-700">Nenhum log de sincronização registrado</p>
              <p className="text-xs text-slate-400 mt-1">Execute uma sincronização manual para gerar novos logs.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {logsData.logs.map((log: SyncLogItem) => (
                <div key={log.id} className="p-4 space-y-1.5 hover:bg-slate-50/60 transition text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {log.status === 'SYNCED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Sincronizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" /> Falha no Envio
                        </span>
                      )}
                      <span className="font-semibold text-slate-800 flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {log.document?.title || `Doc ID: ${log.documentId}`}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{formatDateTime(log.lastSyncedAt)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-0.5">
                    {log.gcalEventId && (
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        GCal Event: {log.gcalEventId}
                      </span>
                    )}
                    {log.errorMessage && (
                      <span className="text-red-600 font-medium text-[11px]">{log.errorMessage}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Página <strong>{page}</strong> de <strong>{logsData?.totalPages || 1}</strong> ({logsData?.total || 0} total)
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
              disabled={!logsData || page >= logsData.totalPages || isLoading}
              onClick={() => fetchLogs(page + 1)}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Próxima
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncLogsModal;
