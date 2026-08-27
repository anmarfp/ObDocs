import React from 'react';

interface AuditDiffViewerProps {
  diffData: Record<string, { old?: unknown; new?: unknown } | unknown>;
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Título do Documento',
  categoryId: 'Categoria',
  issuingBody: 'Órgão Emissor',
  issueDate: 'Data de Emissão',
  expirationDate: 'Data de Vencimento',
  alertLeadDays: 'Antecedência de Alerta (Dias)',
  status: 'Status',
  responsibleName: 'Nome do Responsável',
  responsibleEmail: 'E-mail do Responsável',
  notes: 'Observações',
  attachmentFilename: 'Nome do Anexo',
  isArchived: 'Estado de Arquivamento',
  archivedVersionNumber: 'Versão Histórica Gerada',
  deletedDocumentId: 'ID do Documento Excluído',
  notificationMode: 'Modo de Notificação',
  isActive: 'Status da Conta',
  passwordHash: 'Hash da Senha',
  role: 'Papel do Usuário',
};

const formatDiffValue = (val: unknown): string => {
  if (val === null || val === undefined) return '(vazio)';
  if (typeof val === 'boolean') return val ? 'Verdadeiro' : 'Falso';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return '[Objeto]';
    }
  }
  return String(val);
};

export const AuditDiffViewer: React.FC<AuditDiffViewerProps> = ({ diffData }) => {
  if (!diffData || typeof diffData !== 'object' || Object.keys(diffData).length === 0) {
    return <span className="text-slate-400 text-xs italic">Sem alterações detalhadas registradas.</span>;
  }

  return (
    <div className="space-y-1.5 text-xs">
      {Object.entries(diffData).map(([key, val]) => {
        const label = FIELD_LABELS[key] || key;

        let oldVal: unknown = undefined;
        let newVal: unknown = undefined;

        if (val && typeof val === 'object' && ('old' in val || 'new' in val)) {
          oldVal = (val as { old?: unknown }).old;
          newVal = (val as { new?: unknown }).new;
        } else {
          newVal = val;
        }

        const isNewOnly = oldVal === undefined && newVal !== undefined;

        return (
          <div
            key={key}
            className="p-2 rounded-lg bg-slate-50 border border-slate-100 font-mono text-[11px] leading-relaxed"
          >
            <span className="font-semibold text-slate-700 font-sans">{label}: </span>
            {!isNewOnly && oldVal !== undefined && (
              <span className="text-red-600 line-through mr-2 font-medium">
                {formatDiffValue(oldVal)}
              </span>
            )}
            <span className="text-emerald-700 font-medium">
              {formatDiffValue(newVal)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default AuditDiffViewer;
