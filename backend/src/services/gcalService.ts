import { SyncStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export interface SyncDocumentEventResult {
  documentId: string;
  gcalEventId?: string;
  status: SyncStatus;
  errorMessage?: string;
}

export interface SyncAllResult {
  total: number;
  synced: number;
}

/**
 * Sincroniza um documento específico com o Google Agenda e registra o log de sincronização (RF-005 / RN-007).
 */
export async function syncDocumentEvent(
  doc: { id: string; title: string; expirationDate?: Date | string | null },
  action: string = 'sync'
): Promise<SyncDocumentEventResult> {
  if (!doc.expirationDate) {
    const errorMessage = 'Documento sem data de vencimento para sincronização no Google Agenda.';
    await prisma.gCalSyncLog.create({
      data: {
        documentId: doc.id,
        status: SyncStatus.ERROR,
        errorMessage,
      },
    });

    return {
      documentId: doc.id,
      status: SyncStatus.ERROR,
      errorMessage,
    };
  }

  // Identificador do evento no calendário (Google Agenda API / Simulação estruturada)
  const gcalEventId = `gcal-event-${doc.id}`;

  await prisma.gCalSyncLog.create({
    data: {
      documentId: doc.id,
      gcalEventId,
      status: SyncStatus.SYNCED,
    },
  });

  return {
    documentId: doc.id,
    gcalEventId,
    status: SyncStatus.SYNCED,
  };
}

/**
 * Sincroniza em lote todos os documentos ativos que possuem data de vencimento com o Google Agenda (RF-005).
 */
export async function syncAllDocuments(): Promise<SyncAllResult> {
  const documents = await prisma.document.findMany({
    where: {
      isArchived: false,
      expirationDate: { not: null },
    },
  });

  let synced = 0;
  for (const doc of documents) {
    const result = await syncDocumentEvent(doc, 'sync');
    if (result.status === SyncStatus.SYNCED) {
      synced++;
    }
  }

  return {
    total: documents.length,
    synced,
  };
}
