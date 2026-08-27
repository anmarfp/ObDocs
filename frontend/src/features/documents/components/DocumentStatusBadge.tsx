import React from 'react';
import { DocumentStatus } from '../types/document.types';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
  showDot?: boolean;
}

export const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  EXPIRED: {
    label: 'Vencido',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    dotClass: 'bg-red-500',
  },
  CRITICAL: {
    label: 'Alerta Crítico',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  RENEWAL_IN_PROGRESS: {
    label: 'Em Renovação',
    badgeClass: 'bg-sky-100 text-navy-900 border-navy-400',
    dotClass: 'bg-navy-600',
  },
  REGULAR: {
    label: 'Regular',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  INDETERMINATE: {
    label: 'Indeterminado',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  className = '',
  showDot = true,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.INDETERMINATE;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeClass} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${config.dotClass}`}
        />
      )}
      {config.label}
    </span>
  );
};

export default DocumentStatusBadge;
