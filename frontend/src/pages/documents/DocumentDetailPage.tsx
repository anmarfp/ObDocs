import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Download,
  ExternalLink,
  Calendar,
  Building,
  User,
  Clock,
  History,
  Archive,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Document, DocumentCategory } from '@/features/documents/types/document.types';
import { documentService } from '@/features/documents/services/documentService';
import { categoryService } from '@/features/documents/services/categoryService';
import { formatDate, formatDateTime } from '@/features/documents/utils/dateHelper';
import { formatFileSize } from '@/features/documents/components/FileDropzone';
import DocumentStatusBadge from '@/features/documents/components/DocumentStatusBadge';
import { DocumentFormModal } from '@/features/documents/components/DocumentFormModal';
import { DocumentRenewModal } from '@/features/documents/components/DocumentRenewModal';
import { DeleteConfirmModal } from '@/features/documents/components/DeleteConfirmModal';
import { ToastContainer } from '@/features/documents/components/Toast';
import { useToast } from '@/features/documents/hooks/useToast';

type DetailTab = 'info' | 'versions' | 'audit' | 'gcal';

export const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { toasts, removeToast, toastSuccess, toastError } = useToast();

  const [doc, setDoc] = useState<Document | null>(null);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('info');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isRenewOpen, setIsRenewOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await documentService.getDocumentById(id);
      setDoc(data);
    } catch (err) {
      console.error('Falha ao carregar detalhes do documento:', err);
      toastError('Erro ao Carregar', 'Não foi possível buscar as informações do documento.');
      navigate('/documentos');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleDownload = async (url: string | null, filename: string | null) => {
    if (!url) return;
    setIsDownloading(true);
    try {
      await documentService.downloadAttachment(url, filename || 'anexo');
    } catch (err) {
      console.error('Erro no download do anexo:', err);
      toastError('Erro no Download', 'Não foi possível baixar o anexo autenticado.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async (url: string | null) => {
    if (!url) return;
    try {
      await documentService.previewAttachment(url);
    } catch (err) {
      console.error('Erro na visualização do anexo:', err);
      toastError('Erro na Visualização', 'Não foi possível carregar a prévia do anexo.');
    }
  };

  const handleToggleArchive = async () => {
    if (!doc) return;
    try {
      const res = await documentService.toggleArchive(doc.id);
      toastSuccess(doc.isArchived ? 'Documento desarquivado' : 'Documento arquivado', res.message);
      fetchDocument();
    } catch (err) {
      console.error('Erro ao alternar arquivamento:', err);
      toastError('Falha na Ação', 'Não foi possível alterar o estado de arquivamento do documento.');
    }
  };

  const renderAuditDiff = (diffData: Record<string, any>) => {
    if (!diffData || Object.keys(diffData).length === 0) {
      return <span className="text-slate-400 text-xs italic">Sem alterações registradas.</span>;
    }

    const fieldLabels: Record<string, string> = {
      title: 'Título',
      categoryId: 'Categoria',
      issuingBody: 'Órgão Emissor',
      issueDate: 'Data de Emissão',
      expirationDate: 'Data de Vencimento',
      alertLeadDays: 'Dias de Alerta',
      status: 'Status',
      responsibleName: 'Nome do Responsável',
      responsibleEmail: 'E-mail do Responsável',
      notes: 'Observações',
      attachmentFilename: 'Arquivo Anexo',
      isArchived: 'Arquivamento',
      archivedVersionNumber: 'Versão Arquivada',
      deletedDocumentId: 'ID Excluído',
    };

    return (
      <div className="space-y-1 mt-1 text-xs">
        {Object.entries(diffData).map(([key, val]) => {
          const label = fieldLabels[key] || key;
          const oldVal = val && typeof val === 'object' && 'old' in val ? (val as any).old : undefined;
          const newVal = val && typeof val === 'object' && 'new' in val ? (val as any).new : val;

          return (
            <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[11px]">
              <span className="font-semibold text-slate-700 font-sans">{label}: </span>
              {oldVal !== undefined && (
                <span className="text-red-600 line-through mr-2">
                  {oldVal === null ? 'vazio' : String(oldVal)}
                </span>
              )}
              <span className="text-emerald-700 font-medium">
                {newVal === null ? 'vazio' : String(newVal)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-navy-600 mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Buscando informações do documento...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="py-24 text-center text-slate-500">
        <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p>Documento não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/documentos')}
          className="p-2 mt-0.5 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition flex-shrink-0"
          aria-label="Voltar para Documentos"
          title="Voltar para Documentos"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
            {doc.isArchived && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">
                <Archive className="w-3 h-3 mr-1" /> Arquivado
              </span>
            )}
            <DocumentStatusBadge status={doc.status} />
            {doc.category && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border"
                style={{
                  backgroundColor: doc.category.colorHex ? `${doc.category.colorHex}15` : '#f1f5f9',
                  borderColor: doc.category.colorHex ? `${doc.category.colorHex}40` : '#cbd5e1',
                  color: doc.category.colorHex || '#334155',
                }}
              >
                {doc.category.name}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight truncate">{doc.title}</h1>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 border-b-2 transition whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-navy-600 text-navy-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Visão Geral e Anexo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'versions'
                ? 'border-navy-600 text-navy-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Versões ({doc.versions?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-navy-600 text-navy-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Auditoria ({doc.auditLogs?.length || 0})</span>
          </button>
          {doc.gcalSyncLogs && doc.gcalSyncLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('gcal')}
              className={`py-3 px-3 border-b-2 transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeTab === 'gcal'
                  ? 'border-navy-600 text-navy-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Google Calendar</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Órgão Emissor
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center">
                    <Building className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {doc.issuingBody || 'Não informado'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Data de Emissão
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {formatDate(doc.issueDate)}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Data de Vencimento
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {doc.expirationDate ? formatDate(doc.expirationDate) : 'Indeterminado'}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Antecedência do Alerta
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    {doc.alertLeadDays} dias antes do vencimento
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Responsável Notificado
                  </span>
                  <p className="text-sm font-semibold text-slate-800 flex items-center truncate">
                    <User className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                    {doc.responsibleName ? (
                      <span title={doc.responsibleEmail || ''}>
                        {doc.responsibleName} {doc.responsibleEmail && `(${doc.responsibleEmail})`}
                      </span>
                    ) : (
                      'Todos os Administradores'
                    )}
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cadastrado por
                  </span>
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {doc.createdBy?.name || 'Sistema'}
                    <span className="text-xs font-normal text-slate-400 block">
                      em {formatDate(doc.createdAt)}
                    </span>
                  </p>
                </div>
              </div>

              {doc.notes && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Observações e Condicionantes
                  </span>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{doc.notes}</p>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5 text-navy-600" />
                  Anexo Digital Vigente
                </h3>

                {doc.attachmentUrl ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {doc.attachmentFilename || 'documento-anexo'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(doc.fileSizeBytes)} &bull; {doc.fileMimeType || 'application/octet-stream'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handlePreview(doc.attachmentUrl)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Visualizar
                      </button>
                      <button
                        type="button"
                        disabled={isDownloading}
                        onClick={() => handleDownload(doc.attachmentUrl, doc.attachmentFilename)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        ) : (
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        Baixar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileSpreadsheet className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">Nenhum arquivo digital anexado a este documento.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy-950">Histórico de Versões e Renovações</h3>
                <span className="text-xs text-slate-500">
                  Snapshots imutáveis gerados a cada ciclo de renovação
                </span>
              </div>

              {!doc.versions || doc.versions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-600">Nenhuma versão anterior registrada</p>
                  <p className="text-xs text-slate-400 mt-1">
                    O documento está em sua 1ª versão inicial. Ao renová-lo, o histórico será gravado aqui.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
                  {doc.versions.map((ver) => (
                    <div key={ver.id} className="p-4 space-y-2 hover:bg-slate-50/60 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-900">
                            Versão #{ver.versionNumber}
                          </span>
                          <span className="text-xs text-slate-400">
                            Renovada em {formatDateTime(ver.createdAt)} por {ver.renewedBy?.name || 'Usuário'}
                          </span>
                        </div>
                        {ver.attachmentUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownload(ver.attachmentUrl, ver.attachmentFilename)}
                            className="text-xs font-semibold text-navy-700 hover:text-navy-900 inline-flex items-center"
                          >
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Baixar Anexo da Versão
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="font-semibold text-slate-700">Emissão: </span>
                          {formatDate(ver.issueDate)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-700">Vencimento: </span>
                          {formatDate(ver.expirationDate)}
                        </div>
                      </div>

                      {ver.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 italic">
                          &quot;{ver.notes}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-navy-950">Trilha de Auditoria (RN-008)</h3>
                <span className="text-xs text-slate-500">Registro cronológico de todas as modificações</span>
              </div>

              {!doc.auditLogs || doc.auditLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhum registro de auditoria disponível.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {doc.auditLogs.map((log) => {
                    const actionBadges: Record<string, { bg: string; text: string }> = {
                      CREATE: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
                      UPDATE: { bg: 'bg-blue-100', text: 'text-blue-800' },
                      ARCHIVE: { bg: 'bg-amber-100', text: 'text-amber-800' },
                      UNARCHIVE: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
                      DELETE: { bg: 'bg-red-100', text: 'text-red-800' },
                      RENEW: { bg: 'bg-purple-100', text: 'text-purple-800' },
                    };
                    const badgeStyle = actionBadges[log.action] || { bg: 'bg-slate-100', text: 'text-slate-800' };

                    return (
                      <div key={log.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badgeStyle.bg} ${badgeStyle.text}`}>
                              {log.action}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">{log.userName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{formatDateTime(log.timestamp)}</span>
                        </div>
                        {renderAuditDiff(log.diffData)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'gcal' && doc.gcalSyncLogs && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-navy-950">Sincronização Google Calendar</h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                {doc.gcalSyncLogs.map((gcal) => (
                  <div key={gcal.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {gcal.status === 'SYNCED' ? (
                          <span className="inline-flex items-center text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Sincronizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-700 font-bold">
                            <AlertCircle className="w-4 h-4 mr-1 text-red-600" /> Erro na Sincronização
                          </span>
                        )}
                        {gcal.gcalEventId && (
                          <span className="font-mono text-[11px] text-slate-500">ID: {gcal.gcalEventId}</span>
                        )}
                      </div>
                      {gcal.errorMessage && (
                        <p className="text-red-600 text-[11px] font-medium">{gcal.errorMessage}</p>
                      )}
                    </div>
                    <span className="text-slate-400">{formatDateTime(gcal.lastSyncedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Excluir Documento
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleArchive}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition"
            >
              <Archive className="w-3.5 h-3.5 mr-1.5" />
              {doc.isArchived ? 'Desarquivar' : 'Arquivar'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsRenewOpen(true)}
              className="btn-secondary text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-navy-700" />
              Renovar
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="btn-primary text-xs"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Editar Dados
            </button>
          </div>
        </div>
      </div>

      <DocumentFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(msg) => {
          toastSuccess('Sucesso', msg);
          setIsEditOpen(false);
          fetchDocument();
        }}
        onError={toastError}
        categories={categories}
        documentToEdit={doc}
      />

      <DocumentRenewModal
        isOpen={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        onSuccess={(msg) => {
          toastSuccess('Renovação Concluída', msg);
          setIsRenewOpen(false);
          fetchDocument();
        }}
        onError={toastError}
        document={doc}
      />

      <DeleteConfirmModal
        isOpen={isDeleteOpen}
        document={doc}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={(msg) => {
          toastSuccess('Documento Excluído', msg);
          navigate('/documentos');
        }}
        onError={toastError}
      />
    </div>
  );
};

export default DocumentDetailPage;
