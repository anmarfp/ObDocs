import React from 'react';
import {
  FileText,
  Eye,
  Edit2,
  RefreshCw,
  Archive,
  Trash2,
  Paperclip,
} from 'lucide-react';
import { Document } from '../types/document.types';
import DocumentStatusBadge from './DocumentStatusBadge';
import { formatDate } from '../utils/dateHelper';

interface DocumentTableProps {
  documents: Document[];
  isLoading: boolean;
  isAdmin: boolean;
  onView: (doc: Document) => void;
  onEdit: (doc: Document) => void;
  onRenew: (doc: Document) => void;
  onToggleArchive: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onDownloadAttachment: (url: string, filename: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  isLoading,
  isAdmin,
  onView,
  onEdit,
  onRenew,
  onToggleArchive,
  onDelete,
  onDownloadAttachment,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-navy-50 text-navy-600 flex items-center justify-center mb-3 animate-pulse">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-navy-950">Carregando documentos...</h3>
        <p className="text-xs text-slate-400 mt-1">Buscando listagem atualizada e matriz de status.</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-navy-950">Nenhum documento encontrado</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Não há registros correspondentes aos filtros selecionados ou ainda não existem documentos cadastrados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th scope="col" className="py-3.5 px-4 sm:px-6">Documento</th>
              <th scope="col" className="py-3.5 px-4">Categoria</th>
              <th scope="col" className="py-3.5 px-4">Emissão</th>
              <th scope="col" className="py-3.5 px-4">Vencimento</th>
              <th scope="col" className="py-3.5 px-4">Status</th>
              <th scope="col" className="py-3.5 px-4 hidden lg:table-cell">Responsável</th>
              <th scope="col" className="py-3.5 px-4 text-right pr-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {documents.map((doc) => {
              const isArchived = doc.isArchived;

              return (
                <tr
                  key={doc.id}
                  className={`hover:bg-slate-50/80 transition group ${
                    isArchived ? 'bg-slate-50/40 opacity-75' : ''
                  }`}
                >
                  {/* Document Title & Issuing Body */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-start space-x-3">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onView(doc)}
                        className="w-9 h-9 rounded-xl bg-navy-50 text-navy-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-navy-100 cursor-pointer transition"
                        title="Ver detalhes"
                      >
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => onView(doc)}
                            className="font-bold text-slate-800 hover:text-navy-700 text-sm text-left truncate transition max-w-xs sm:max-w-sm md:max-w-md"
                          >
                            {doc.title}
                          </button>
                          {doc.attachmentUrl && (
                            <button
                              type="button"
                              onClick={() => onDownloadAttachment(doc.attachmentUrl!, doc.attachmentFilename || 'documento')}
                              title={`Anexo: ${doc.attachmentFilename || 'arquivo'}`}
                              className="text-slate-400 hover:text-navy-700 flex-shrink-0"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isArchived && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                              Arquivado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {doc.issuingBody ? `Órgão: ${doc.issuingBody}` : 'Sem órgão emissor'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      {doc.category ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border"
                          style={{
                            backgroundColor: doc.category.colorHex ? `${doc.category.colorHex}15` : '#f1f5f9',
                            borderColor: doc.category.colorHex ? `${doc.category.colorHex}40` : '#cbd5e1',
                            color: doc.category.colorHex || '#334155',
                          }}
                        >
                          {doc.category.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>
                  </td>

                  {/* Issue Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    <div>{formatDate(doc.issueDate)}</div>
                  </td>

                  {/* Expiration Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      {doc.expirationDate ? (
                        <div>
                          <span className="font-medium text-slate-800">{formatDate(doc.expirationDate)}</span>
                          {doc.alertLeadDays && (
                            <span className="block text-[10px] text-slate-400">
                              Alerta: {doc.alertLeadDays}d
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Indeterminado</span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      <DocumentStatusBadge status={doc.status} />
                    </div>
                  </td>

                  {/* Responsible */}
                  <td className="py-3.5 px-4 hidden lg:table-cell whitespace-nowrap">
                    <div>
                      {doc.responsibleName ? (
                        <div className="truncate max-w-[140px]" title={`${doc.responsibleName} (${doc.responsibleEmail || ''})`}>
                          <p className="font-medium text-slate-700 truncate">{doc.responsibleName}</p>
                          {doc.responsibleEmail && (
                            <p className="text-[10px] text-slate-400 truncate">{doc.responsibleEmail}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Todos Admins</span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => onView(doc)}
                        className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition"
                        title="Ver Detalhes e Histórico"
                        aria-label="Ver detalhes do documento"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(doc)}
                        className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-lg transition"
                        title="Editar Documento"
                        aria-label="Editar documento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Renew */}
                      <button
                        type="button"
                        onClick={() => onRenew(doc)}
                        className="p-1.5 text-slate-500 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition"
                        title="Renovar Documento"
                        aria-label="Renovar documento"
                      >
                        <RefreshCw className="w-4 h-4 text-navy-700" />
                      </button>

                      {/* Archive / Unarchive */}
                      <button
                        type="button"
                        onClick={() => onToggleArchive(doc)}
                        className={`p-1.5 rounded-lg transition ${
                          isArchived
                            ? 'text-indigo-600 hover:bg-indigo-50'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                        title={isArchived ? 'Desarquivar Documento' : 'Arquivar Documento'}
                        aria-label={isArchived ? 'Desarquivar documento' : 'Arquivar documento'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>

                      {/* Delete (Admin only) */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onDelete(doc)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir Permanentemente"
                          aria-label="Excluir documento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DocumentTable;
