import { DocumentStatus } from '@prisma/client';

/**
 * Aplica regras de escape de CSV de acordo com RFC 4180.
 * Envolve o valor em aspas se contiver vírgula, aspas, quebra de linha (\n ou \r),
 * duplicando aspas internas.
 */
export function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Formata campos de data para o padrão ISO YYYY-MM-DD.
 */
function formatDate(date: any): string {
  if (!date) return '';
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '';
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return trimmed;
    return parsed.toISOString().split('T')[0];
  }
  return String(date);
}

/**
 * Gera conteúdo CSV no padrão UTF-8 com BOM e cabeçalhos em português (RF-007).
 */
export function generateDocumentsCsv(documents: any[]): string {
  const BOM = '\uFEFF';
  const headers = [
    'ID',
    'Título',
    'Categoria',
    'Órgão Emissor',
    'Data Emissão',
    'Data Vencimento',
    'Status',
    'Responsável',
    'E-mail Responsável',
  ];

  const rows = documents.map((doc) => {
    const categoryName = doc.category?.name || doc.categoryName || '';
    return [
      escapeCsvField(doc.id),
      escapeCsvField(doc.title),
      escapeCsvField(categoryName),
      escapeCsvField(doc.issuingBody),
      escapeCsvField(formatDate(doc.issueDate)),
      escapeCsvField(formatDate(doc.expirationDate)),
      escapeCsvField(doc.status),
      escapeCsvField(doc.responsibleName),
      escapeCsvField(doc.responsibleEmail),
    ].join(',');
  });

  return [BOM + headers.join(','), ...rows].join('\n');
}

export interface SummaryReport {
  totalDocuments: number;
  complianceRate: number;
  statusCounts: Record<DocumentStatus, number>;
}

/**
 * Gera o resumo executivo de documentos com totais, conformidade e contagem completa por status.
 */
export function generateSummaryReport(documents: any[]): SummaryReport {
  const statusCounts: Record<DocumentStatus, number> = {
    EXPIRED: 0,
    CRITICAL: 0,
    RENEWAL_IN_PROGRESS: 0,
    REGULAR: 0,
    INDETERMINATE: 0,
  };

  for (const doc of documents) {
    if (doc.status && doc.status in statusCounts) {
      statusCounts[doc.status as DocumentStatus]++;
    }
  }

  const totalDocuments = documents.length;
  const complianceRate =
    totalDocuments === 0 ? 100 : Math.round((statusCounts.REGULAR / totalDocuments) * 100);

  return {
    totalDocuments,
    complianceRate,
    statusCounts,
  };
}
