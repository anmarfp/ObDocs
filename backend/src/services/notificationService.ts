import { DocumentStatus, NotificationMode } from '@prisma/client';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
}

export interface CompanyConfigSummary {
  id?: string;
  notificationMode: NotificationMode;
}

export interface DocumentNotificationData {
  id: string;
  title: string;
  expirationDate?: Date | string | null;
  status: DocumentStatus;
  responsibleName?: string | null;
  responsibleEmail?: string | null;
  category?: {
    id: string;
    name: string;
    colorHex?: string | null;
  } | null;
}

export interface ExpirationAlertResult {
  success: boolean;
  documentId: string;
  status: DocumentStatus;
  recipients: string[];
  subject: string;
  body: string;
  sentAt: Date;
}

export interface DailyDigestSummary {
  critical: DocumentNotificationData[];
  expired: DocumentNotificationData[];
  total: number;
}

export interface DailyDigestResult {
  success: boolean;
  recipients: string[];
  subject: string;
  total: number;
  summary: DailyDigestSummary;
  sentAt: Date;
}

/**
 * Resolve os destinatários de notificação com base no modo de notificação da empresa (RF-012 / RN-004):
 * - ALL_ADMINS: retorna os e-mails de todos os administradores ativos.
 * - ONLY_RESPONSIBLE: retorna apenas o e-mail do responsável pelo documento.
 */
export function resolveNotificationRecipients(
  doc: { responsibleEmail?: string | null },
  config: { notificationMode?: NotificationMode | null } | null,
  admins: Array<{ email: string; isActive?: boolean }>
): string[] {
  const mode = config?.notificationMode || NotificationMode.ALL_ADMINS;

  if (mode === NotificationMode.ONLY_RESPONSIBLE) {
    if (doc?.responsibleEmail && doc.responsibleEmail.trim() !== '') {
      return [doc.responsibleEmail.trim()];
    }
    return [];
  }

  // ALL_ADMINS
  return admins
    .filter((admin) => admin.isActive !== false && Boolean(admin.email))
    .map((admin) => admin.email.trim());
}

/**
 * Simula o disparo de alerta de vencimento de documento (RF-007 / RN-003).
 */
export async function sendExpirationAlert(
  doc: DocumentNotificationData,
  recipients: string[],
  isCritical: boolean
): Promise<ExpirationAlertResult> {
  const isExpired = doc.status === DocumentStatus.EXPIRED || (!isCritical && doc.status !== DocumentStatus.CRITICAL);
  const statusLabel = isExpired ? 'Vencido' : 'Crítico';

  const subject = isExpired
    ? `[DocsOb] Documento Vencido: ${doc.title}`
    : `[DocsOb] Alerta Crítico de Vencimento: ${doc.title}`;

  const formattedDate = doc.expirationDate
    ? new Date(doc.expirationDate).toLocaleDateString('pt-BR')
    : 'Data não informada';

  const body = `Olá,\n\nO documento "${doc.title}" está classificado com o status ${statusLabel.toUpperCase()} (Vencimento: ${formattedDate}).\nPor favor, tome as ações necessárias para regularização ou renovação no sistema DocsOb.`;

  return {
    success: true,
    documentId: doc.id,
    status: doc.status,
    recipients,
    subject,
    body,
    sentAt: new Date(),
  };
}

/**
 * Simula o disparo do Daily Digest consolidado para os administradores ativos (RF-008).
 */
export async function sendDailyDigest(
  admins: Array<{ email: string; isActive?: boolean }>,
  summary: DailyDigestSummary
): Promise<DailyDigestResult> {
  const recipients = admins
    .filter((admin) => admin.isActive !== false && Boolean(admin.email))
    .map((admin) => admin.email.trim());

  const subject = `[DocsOb] Resumo Diário de Vencimentos (Daily Digest) - ${summary.total} documento(s) pendente(s)`;

  return {
    success: true,
    recipients,
    subject,
    total: summary.total,
    summary,
    sentAt: new Date(),
  };
}
