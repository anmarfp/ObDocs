import { DocumentStatus } from '@prisma/client';

/**
 * Normaliza qualquer formato de data (Date, string YYYY-MM-DD ou ISO) para meia-noite (00:00:00.000) local.
 */
export function normalizeDateToMidnight(dateInput: Date | string | null | undefined): Date | null {
  if (!dateInput) return null;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    // Se for formato YYYY-MM-DD
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }

    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return null;
    return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate(), 0, 0, 0, 0);
  }

  return null;
}

/**
 * Calcula a diferença em dias inteiros entre a data de vencimento e hoje.
 * Retorna número negativo se já venceu.
 */
export function getDaysUntilExpiration(
  expirationDate: Date | string | null | undefined,
  baseDate: Date = new Date()
): number | null {
  const expMidnight = normalizeDateToMidnight(expirationDate);
  if (!expMidnight) return null;

  const todayMidnight = normalizeDateToMidnight(baseDate)!;
  const diffTime = expMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula o status de um documento com base na matriz de cores (RN-001 / ARCHITECTURE.md §4):
 * 1. INDETERMINATE se expirationDate for null/undefined/vazio.
 * 2. RENEWAL_IN_PROGRESS se isRenewalInProgress === true.
 * 3. EXPIRED se expirationDate for anterior a hoje (meia-noite).
 * 4. CRITICAL se a diferença em dias for <= alertLeadDays.
 * 5. REGULAR caso contrário.
 */
export function calculateDocumentStatus(
  expirationDate: Date | string | null | undefined,
  alertLeadDays: number = 30,
  isRenewalInProgress: boolean = false,
  baseDate: Date = new Date()
): DocumentStatus {
  const expMidnight = normalizeDateToMidnight(expirationDate);

  // 1. Sem data de vencimento -> Validade permanente / Indeterminado
  if (!expMidnight) {
    return DocumentStatus.INDETERMINATE;
  }

  // 2. Sinalização manual de renovação em andamento
  if (isRenewalInProgress) {
    return DocumentStatus.RENEWAL_IN_PROGRESS;
  }

  const todayMidnight = normalizeDateToMidnight(baseDate)!;

  // 3. Data de vencimento anterior ao dia de hoje (meia-noite)
  if (expMidnight.getTime() < todayMidnight.getTime()) {
    return DocumentStatus.EXPIRED;
  }

  // 4. Antecedência crítica de alerta
  const diffDays = Math.round((expMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= alertLeadDays) {
    return DocumentStatus.CRITICAL;
  }

  // 5. Regular / Em dia
  return DocumentStatus.REGULAR;
}
