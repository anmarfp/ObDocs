import React from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, User, Calendar, FileText } from 'lucide-react';
import { AuditLogItem } from '../types/audit.types';
import { formatDateTime } from '@/features/documents/utils/dateHelper';
import AuditDiffViewer from './AuditDiffViewer';

interface AuditDetailModalProps {
  isOpen: boolean;
  log: AuditLogItem | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ isOpen, log, onClose }) => {
  if (!isOpen || !log) return null;

  const actionBadges: Record<string, { bg: string; text: string }> = {
    CREATE: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800' },
    ARCHIVE: { bg: 'bg-amber-100', text: 'text-amber-800' },
    UNARCHIVE: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    DELETE: { bg: 'bg-red-100', text: 'text-red-800' },
    RENEW: { bg: 'bg-purple-100', text: 'text-purple-800' },
  };

  const badgeStyle = actionBadges[log.action] || { bg: 'bg-slate-100', text: 'text-slate-800' };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-detail-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="audit-detail-title" className="text-lg font-bold text-navy-950">
                Detalhes do Registro de Auditoria
              </h2>
              <p className="text-xs text-slate-500 font-mono">ID: {log.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            aria-label="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ação</span>
              <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${badgeStyle.bg} ${badgeStyle.text}`}>
                {log.action}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data e Hora</span>
              <span className="font-semibold text-slate-800 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {formatDateTime(log.timestamp)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Autor da Modificação</span>
              <span className="font-semibold text-slate-800 flex items-center truncate">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                {log.userName} {log.user?.email && `(${log.user.email})`}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Documento Vinculado</span>
              <span className="font-semibold text-slate-800 flex items-center truncate">
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                {log.document?.title || (log.documentId ? `ID: ${log.documentId}` : 'Documento Excluído / Global')}
              </span>
            </div>
          </div>

          {/* Diff Data Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Diferenças Registradas (Diff Data)
            </h3>
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <AuditDiffViewer diffData={log.diffData} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button type="button" onClick={onClose} className="btn-secondary text-xs">
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuditDetailModal;
