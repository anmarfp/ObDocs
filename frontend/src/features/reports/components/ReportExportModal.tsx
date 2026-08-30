import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Loader2,
  FileSpreadsheet,
  FileCode,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DocumentCategory, DocumentStatus } from '@/features/documents/types/document.types';
import { categoryService } from '@/features/documents/services/categoryService';
import { reportService } from '../services/reportService';
import { SummaryReport } from '../types/report.types';
import { STATUS_CONFIG } from '@/features/documents/components/DocumentStatusBadge';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onError: (title: string, message?: string) => void;
  onSuccess: (title: string, message?: string) => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  onError,
  onSuccess,
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json'>('csv');
  const [status, setStatus] = useState<DocumentStatus | ''>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);

  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Load categories
  useEffect(() => {
    if (isOpen) {
      categoryService
        .getCategories()
        .then((cats) => setCategories(cats))
        .catch((err) => console.error('Erro ao buscar categorias para relatório:', err));
    }
  }, [isOpen]);

  // Load summary whenever filters change
  const fetchSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    try {
      const data = await reportService.getSummary({
        status: status || undefined,
        categoryId: categoryId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        includeArchived: isAdmin ? includeArchived : false,
      });
      setSummary(data);
    } catch (err) {
      console.error('Erro ao carregar resumo do relatório:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [status, categoryId, startDate, endDate, includeArchived, isAdmin]);

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen, fetchSummary]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = {
        format: selectedFormat,
        status: status || undefined,
        categoryId: categoryId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        includeArchived: isAdmin ? includeArchived : false,
      };

      if (selectedFormat === 'csv') {
        await reportService.exportCsv(params);
        onSuccess('Exportação Concluída', 'O relatório CSV foi gerado e baixado com sucesso.');
      } else {
        const result = await reportService.exportJson(params);
        // Create JSON blob download
        const blob = new Blob([JSON.stringify(result, null, 2)], {
          type: 'application/json;charset=utf-8;',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-documentos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        onSuccess('Exportação Concluída', `${result.total} documento(s) exportado(s) em JSON.`);
      }
      onClose();
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error);
      onError(
        'Falha na Exportação',
        error.message || 'Não foi possível gerar o arquivo de relatório. Verifique os filtros e tente novamente.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 id="export-modal-title" className="text-lg font-bold text-navy-950">
                Exportar Relatório de Documentos
              </h2>
              <p className="text-xs text-slate-500">
                Selecione os filtros e formato de dados desejado (CSV com UTF-8 BOM ou JSON).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Format Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Formato de Exportação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition text-left ${
                  selectedFormat === 'csv'
                    ? 'border-navy-600 bg-navy-50/60 ring-2 ring-navy-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-950">Planilha CSV (Excel)</p>
                  <p className="text-[10px] text-slate-500">UTF-8 com BOM e colunas em português</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition text-left ${
                  selectedFormat === 'json'
                    ? 'border-navy-600 bg-navy-50/60 ring-2 ring-navy-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy-950">Formato JSON</p>
                  <p className="text-[10px] text-slate-500">Dados brutos para integrações e APIs</p>
                </div>
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filtros do Relatório
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DocumentStatus | '')}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
                >
                  <option value="">Todos os Status</option>
                  {Object.entries(STATUS_CONFIG).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">Categoria</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
                >
                  <option value="">Todas as Categorias</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">
                  Vencimento De (Início)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">
                  Vencimento Até (Fim)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-navy-600 transition"
                />
              </div>
            </div>

            {isAdmin && (
              <label className="inline-flex items-center space-x-2 cursor-pointer pt-1 text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="w-4 h-4 text-navy-600 rounded border-slate-300 focus:ring-navy-500"
                />
                <span>Incluir documentos arquivados no relatório (Permissão Admin)</span>
              </label>
            )}
          </div>

          {/* Dynamic Summary Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-navy-600" />
                Resumo dos Dados Filtrados
              </span>
              {isLoadingSummary ? (
                <span className="flex items-center text-[11px] text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin mr-1" /> Calculando...
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-navy-800">
                  {summary?.totalDocuments || 0} documento(s) encontrado(s)
                </span>
              )}
            </div>

            {summary && !isLoadingSummary && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Total Filtrado</span>
                  <span className="font-bold text-navy-950 text-sm">{summary.totalDocuments}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Em Dia (Regular)</span>
                  <span className="font-bold text-emerald-600 text-sm">{summary.statusCounts.REGULAR || 0}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Conformidade</span>
                  <span className="font-bold text-navy-700 text-sm">{summary.complianceRate}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="btn-secondary text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || isLoadingSummary || (summary?.totalDocuments === 0)}
            className="btn-primary text-xs min-w-[140px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Baixar {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportExportModal;
