import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Save,
  Loader2,
  RefreshCw,
  Send,
  Plus,
  Trash2,
  Tag,
  Users,
  UserCheck,
} from 'lucide-react';
import { companyService } from '@/features/documents/services/companyService';
import { categoryService } from '@/features/documents/services/categoryService';
import { notificationAdminService } from '@/features/notifications/services/notificationAdminService';
import {
  CompanyConfig,
  DocumentCategory,
  NotificationMode,
  DEFAULT_CATEGORY_NAME,
} from '@/features/documents/types/document.types';
import { CategoryFormModal } from '@/features/company/components/CategoryFormModal';
import { ToastContainer } from '@/features/documents/components/Toast';
import { useToast } from '@/features/documents/hooks/useToast';

export const SettingsPage: React.FC = () => {
  const { toasts, removeToast, toastSuccess, toastError } = useToast();

  const [config, setConfig] = useState<CompanyConfig | null>(null);
  const [selectedMode, setSelectedMode] = useState<NotificationMode>('ALL_ADMINS');
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // System Action states
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [isTriggeringDigest, setIsTriggeringDigest] = useState<boolean>(false);

  // Categories state
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const manageableCategories = categories.filter((cat) => cat.name !== DEFAULT_CATEGORY_NAME);

  // Load configuration
  const fetchConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const data = await companyService.getConfig();
      setConfig(data);
      setSelectedMode(data.notificationMode);
    } catch (err: any) {
      console.error('Falha ao carregar configurações da empresa:', err);
      toastError('Erro de Configuração', 'Não foi possível buscar as configurações do sistema.');
    } finally {
      setIsLoadingConfig(false);
    }
  }, [toastError]);

  // Load categories
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Falha ao carregar categorias:', err);
      toastError('Erro de Categorias', 'Não foi possível carregar a lista de categorias.');
    } finally {
      setIsLoadingCategories(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchConfig();
    fetchCategories();
  }, [fetchConfig, fetchCategories]);

  // Save Notification Mode
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      const updated = await companyService.updateConfig({
        notificationMode: selectedMode,
      });
      setConfig(updated);
      toastSuccess(
        'Configuração Atualizada',
        `O modo de notificação foi alterado para ${
          selectedMode === 'ALL_ADMINS' ? 'Todos os Administradores' : 'Apenas Responsável'
        }.`
      );
    } catch (err: any) {
      console.error('Erro ao salvar configuração:', err);
      toastError('Falha ao Salvar', 'Não foi possível atualizar as configurações da empresa.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Trigger Status Recalculation
  const handleRecalculate = async () => {
    if (!window.confirm('Deseja recalcular o status de todos os documentos ativos e disparar alertas imediatos para documentos críticos/vencidos?')) {
      return;
    }

    setIsRecalculating(true);
    try {
      const res = await notificationAdminService.recalculateStatuses();
      toastSuccess(
        'Recálculo Concluído',
        `${res.totalProcessed} documentos processados, ${res.updatedCount} status atualizados e ${res.alertsSent} alertas disparados.`
      );
    } catch (err: any) {
      console.error('Erro ao recalcular status:', err);
      toastError('Falha no Recálculo', 'Não foi possível executar a rotina de recálculo.');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Trigger Daily Digest
  const handleTriggerDigest = async () => {
    if (!window.confirm('Deseja disparar o e-mail de Resumo Diário (Daily Digest) agora para todos os administradores ativos?')) {
      return;
    }

    setIsTriggeringDigest(true);
    try {
      const res = await notificationAdminService.triggerDailyDigest();
      toastSuccess(
        'Daily Digest Enviado',
        `Resumo com ${res.total} documento(s) pendente(s) disparado para ${res.recipients.length} administrador(es).`
      );
    } catch (err: any) {
      console.error('Erro ao disparar Daily Digest:', err);
      toastError('Falha no Envio', 'Não foi possível disparar o Daily Digest.');
    } finally {
      setIsTriggeringDigest(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (cat: DocumentCategory) => {
    if (!window.confirm(`Deseja excluir a categoria "${cat.name}"?`)) {
      return;
    }

    setDeletingCategoryId(cat.id);
    try {
      await categoryService.deleteCategory(cat.id);
      toastSuccess('Categoria Excluída', `A categoria "${cat.name}" foi removida com sucesso.`);
      fetchCategories();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Não foi possível excluir a categoria.';
      toastError('Falha ao Excluir Categoria', errMsg);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-navy-950 tracking-tight">Configurações do Sistema</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy-100 text-navy-900 border border-navy-400">
              Admin Exclusivo
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Parâmetros globais, políticas de notificação (RN-004), rotinas administrativas e categorias.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notification Mode & Routines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Notification Policy (RN-004) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-navy-950 flex items-center">
                  <Bell className="w-4 h-4 text-navy-600 mr-2" />
                  Política de Notificação de Vencimentos (RN-004)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define quem receberá os alertas quando um documento entrar em prazo crítico ou expirar.
                </p>
              </div>
            </div>

            {isLoadingConfig ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-navy-600 mb-1" />
                Carregando configurações...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: ALL_ADMINS */}
                  <div
                    onClick={() => setSelectedMode('ALL_ADMINS')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      selectedMode === 'ALL_ADMINS'
                        ? 'border-navy-600 bg-navy-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center">
                          <Users className="w-4 h-4" />
                        </span>
                        <input
                          type="radio"
                          name="notificationMode"
                          value="ALL_ADMINS"
                          checked={selectedMode === 'ALL_ADMINS'}
                          onChange={() => setSelectedMode('ALL_ADMINS')}
                          className="w-4 h-4 text-navy-600 focus:ring-navy-500"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-navy-950">Todos os Administradores</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Todos os usuários com perfil de Administrador recebem os alertas e o Daily Digest. Os campos de responsável são opcionais/ocultos.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: ONLY_RESPONSIBLE */}
                  <div
                    onClick={() => setSelectedMode('ONLY_RESPONSIBLE')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      selectedMode === 'ONLY_RESPONSIBLE'
                        ? 'border-navy-600 bg-navy-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="w-8 h-8 rounded-lg bg-navy-100 text-navy-800 flex items-center justify-center">
                          <UserCheck className="w-4 h-4" />
                        </span>
                        <input
                          type="radio"
                          name="notificationMode"
                          value="ONLY_RESPONSIBLE"
                          checked={selectedMode === 'ONLY_RESPONSIBLE'}
                          onChange={() => setSelectedMode('ONLY_RESPONSIBLE')}
                          className="w-4 h-4 text-navy-600 focus:ring-navy-500"
                        />
                      </div>
                      <h3 className="text-sm font-bold text-navy-950">Apenas o Responsável</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        O alerta é enviado exclusivamente para o e-mail do responsável cadastrado no documento. Nome e e-mail tornam-se <strong>obrigatórios</strong> no cadastro.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    disabled={isSavingConfig || selectedMode === config?.notificationMode}
                    className="btn-primary text-xs min-w-[140px]"
                  >
                    {isSavingConfig ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                        Salvar Política
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Administrative Routines */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-navy-950 flex items-center">
                <RefreshCw className="w-4 h-4 text-navy-600 mr-2" />
                Rotinas e Ações Administrativas Manuais
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Execução manual imediata das rotinas agendadas de conformidade e envio de e-mails.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Routine 1: Recalculate Statuses */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recalcular Matriz de Status
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Avalia todos os prazos em relação à data atual, atualiza status e despacha alertas imediatos para documentos em estado Crítico ou Vencido.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRecalculate}
                  disabled={isRecalculating}
                  className="btn-secondary text-xs w-full"
                >
                  {isRecalculating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Recalculando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Executar Recálculo
                    </>
                  )}
                </button>
              </div>

              {/* Routine 2: Trigger Daily Digest */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Disparar Daily Digest
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Gera e despacha o e-mail consolidado do dia com a lista de pendências críticas e vencidas para todos os administradores ativos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerDigest}
                  disabled={isTriggeringDigest}
                  className="btn-secondary text-xs w-full"
                >
                  {isTriggeringDigest ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Disparando...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Disparar Digest Agora
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Category Management */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-navy-950 flex items-center">
                  <Tag className="w-4 h-4 text-navy-600 mr-2" />
                  Categorias de Documentos
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Classificações temáticas para organização.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="btn-primary text-xs w-full"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Adicionar Categoria
            </button>

            {/* Categories List */}
            {/* "Sem Categoria" é a categoria padrão do sistema e não é gerenciável aqui. */}
            {isLoadingCategories ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-navy-600 mb-1" />
                Carregando categorias...
              </div>
            ) : manageableCategories.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Nenhuma categoria cadastrada.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                {manageableCategories.map((cat) => (
                  <div key={cat.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.colorHex || '#3b82f6' }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{cat.name}</p>
                        {cat.description && (
                          <p className="text-[10px] text-slate-400 truncate">{cat.description}</p>
                        )}
                        {cat.documentCount !== undefined && (
                          <span className="text-[10px] text-navy-600 font-medium">
                            {cat.documentCount} documento(s)
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={deletingCategoryId === cat.id}
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir categoria"
                      aria-label={`Excluir categoria ${cat.name}`}
                    >
                      {deletingCategoryId === cat.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Create Modal */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={(msg) => {
          toastSuccess('Sucesso', msg);
          fetchCategories();
        }}
        onError={toastError}
      />
    </div>
  );
};

export default SettingsPage;
