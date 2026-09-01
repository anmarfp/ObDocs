import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  FileText,
  Link2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { calendarService } from '@/features/calendar/services/calendarService';
import { googleAuthService, navigateToGoogleConsent } from '@/features/calendar/services/googleAuthService';
import { CalendarEventItem } from '@/features/calendar/types/calendar.types';
import { SyncLogsModal } from '@/features/calendar/components/SyncLogsModal';
import { ToastContainer } from '@/features/documents/components/Toast';
import { useToast } from '@/features/documents/hooks/useToast';
import { formatDate } from '@/features/documents/utils/dateHelper';
import DocumentStatusBadge from '@/features/documents/components/DocumentStatusBadge';

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const { toasts, removeToast, toastSuccess, toastError } = useToast();

  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth() + 1); // 1..12

  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogsOpen, setSyncLogsOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState<boolean>(false);

  // Fetch events from GET /calendar/events?year=YYYY&month=M
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await calendarService.getEvents(currentYear, currentMonth);
      setEvents(data);
    } catch (err: any) {
      console.error('Falha ao carregar eventos do calendário:', err);
      toastError('Erro no Calendário', 'Não foi possível carregar os prazos do mês selecionado.');
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth, toastError]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Check Google Calendar connection status (DOC-28 QA follow-up): the sync
  // button only makes sense once the user has connected their Google Agenda.
  const fetchGoogleStatus = useCallback(async () => {
    try {
      const data = await googleAuthService.getStatus();
      setIsGoogleConnected(data.connected);
    } catch (err: any) {
      console.error('Falha ao consultar status da conexão com o Google Agenda:', err);
      setIsGoogleConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchGoogleStatus();
  }, [fetchGoogleStatus]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
  };

  // Sync with calendar
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await calendarService.syncCalendar();
      toastSuccess(
        'Sincronização Concluída',
        `${res.synced} de ${res.total} documento(s) com vencimento sincronizados com o Google Agenda.`
      );
      fetchEvents();
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      toastError('Falha na Sincronização', 'Não foi possível concluir a sincronização da agenda.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect Google Calendar from the Calendar page (DOC-28 QA follow-up):
  // same flow as SettingsPage.tsx's handleConnectGoogle — fetch the signed
  // consent URL via an authenticated call, then do a full-page browser
  // navigation to Google (not an XHR, since the consent screen must be
  // rendered by the browser itself).
  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const url = await googleAuthService.getConnectUrl();
      navigateToGoogleConsent(url);
    } catch (err: any) {
      console.error('Erro ao gerar URL de conexão com o Google Agenda:', err);
      const message = err?.response?.data?.error === 'GOOGLE_OAUTH_NOT_CONFIGURED'
        ? 'A integração com o Google Agenda ainda não foi configurada neste ambiente.'
        : 'Não foi possível iniciar a conexão com o Google Agenda.';
      toastError('Falha ao Conectar', message);
      setIsConnectingGoogle(false);
    }
  };

  // Build days for month grid
  const calendarGrid = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    // Map events by YYYY-MM-DD
    const eventsByDate = new Map<string, CalendarEventItem[]>();
    for (const ev of events) {
      if (ev.expirationDate) {
        // Safe string extraction of YYYY-MM-DD
        const dateKey = ev.expirationDate.split('T')[0];
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, []);
        }
        eventsByDate.get(dateKey)!.push(ev);
      }
    }

    const grid = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      grid.push({
        dayNum,
        isCurrentMonth: false,
        dateKey: '',
        events: [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(currentMonth).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateKey = `${currentYear}-${mm}-${dd}`;
      grid.push({
        dayNum: d,
        isCurrentMonth: true,
        dateKey,
        isToday:
          d === today.getDate() &&
          currentMonth === today.getMonth() + 1 &&
          currentYear === today.getFullYear(),
        events: eventsByDate.get(dateKey) || [],
      });
    }

    // Trailing days to fill 35 or 42 cells
    const remainingCells = (7 - (grid.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      grid.push({
        dayNum: i,
        isCurrentMonth: false,
        dateKey: '',
        events: [],
      });
    }

    return grid;
  }, [currentYear, currentMonth, events, today]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-950 tracking-tight">
            Calendário de Vencimentos & Prazos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualização cronológica mensal dos documentos e sincronização de agenda.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setSyncLogsOpen(true)}
              className="btn-secondary text-xs"
              title="Visualizar logs de sincronização com a agenda"
            >
              <Clock className="w-4 h-4 mr-1.5 text-slate-500" />
              Logs de Sync
            </button>
          )}

          {isGoogleConnected === false ? (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={isConnectingGoogle}
              className="btn-primary text-xs"
              title="Conectar sua conta Google para sincronizar os vencimentos"
            >
              {isConnectingGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-1.5" />
                  Conectar Google Agenda
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="btn-primary text-xs"
              title="Sincronizar documentos ativos com a agenda"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar com Agenda'}
            </button>
          )}
        </div>
      </div>

      {/* Calendar Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-navy-950">
            {MONTH_NAMES[currentMonth - 1]} <span className="text-navy-600 font-normal">{currentYear}</span>
          </h2>
          {isLoading && (
            <span className="flex items-center text-xs text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleToday}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Mês Atual
          </button>
          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded text-slate-600 hover:text-navy-900 hover:bg-white transition"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded text-slate-600 hover:text-navy-900 hover:bg-white transition"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5">
          {WEEK_DAYS.map((w, idx) => (
            <div key={w} className={idx === 0 || idx === 6 ? 'text-slate-400' : ''}>
              {w}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[500px]">
          {calendarGrid.map((cell, idx) => (
            <div
              key={idx}
              className={`p-2 flex flex-col justify-between min-h-[90px] sm:min-h-[110px] transition ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/40 text-slate-300'
                  : cell.isToday
                  ? 'bg-navy-50/30'
                  : 'hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                    cell.isToday
                      ? 'bg-navy-900 text-white font-bold'
                      : cell.isCurrentMonth
                      ? 'text-slate-700'
                      : 'text-slate-300'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {cell.events.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-navy-100 text-navy-800">
                    {cell.events.length}
                  </span>
                )}
              </div>

              {/* Event chips */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                {cell.events.map((ev) => {
                  const statusBorderColor =
                    ev.status === 'EXPIRED'
                      ? 'border-red-400 bg-red-50 text-red-800'
                      : ev.status === 'CRITICAL'
                      ? 'border-amber-400 bg-amber-50 text-amber-800'
                      : ev.status === 'RENEWAL_IN_PROGRESS'
                      ? 'border-sky-400 bg-sky-50 text-navy-900'
                      : 'border-emerald-400 bg-emerald-50 text-emerald-800';

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setSelectedEvent(ev)}
                      title={`${ev.title} (${ev.category?.name || 'Documento'}) - Status: ${ev.status}`}
                      className={`w-full text-left p-1 rounded border text-[10px] font-semibold truncate block transition hover:scale-101 ${statusBorderColor}`}
                    >
                      <span className="truncate block leading-tight">{ev.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Event Details Modal */}
      {selectedEvent && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <DocumentStatusBadge status={selectedEvent.status} />
                {selectedEvent.category && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedEvent.category.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                &times;
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-navy-950">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center">
                <CalendarIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Vencimento em: <strong>{formatDate(selectedEvent.expirationDate)}</strong>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary text-xs"
              >
                Fechar
              </button>
              <Link
                to={`/documentos/${selectedEvent.id}`}
                className="btn-primary text-xs"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Abrir em Documentos
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sync Logs Modal for Admin */}
      {isAdmin && (
        <SyncLogsModal
          isOpen={syncLogsOpen}
          onClose={() => setSyncLogsOpen(false)}
          onError={toastError}
        />
      )}
    </div>
  );
};

export default CalendarPage;
