import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/services/api';
import { AuthContext } from '@/contexts/AuthContext';
import type { AuthContextType, Role, User } from '@/types/auth';
import type { AuditLogItem, AuditLogsResponse } from '@/features/audit/types/audit.types';
import type { CalendarEventItem } from '@/features/calendar/types/calendar.types';
import { calendarService } from '@/features/calendar/services/calendarService';
import { auditService } from '@/features/audit/services/auditService';
import { CalendarPage } from '@/pages/calendar/CalendarPage';
import { AuditPage } from '@/pages/audit/AuditPage';
import { AuditDiffViewer } from '@/features/audit/components/AuditDiffViewer';

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const apiGet = vi.mocked(api.get);
const apiPost = vi.mocked(api.post);

const user: User = {
  id: 'admin-1',
  name: 'Ana Admin',
  email: 'ana@docsob.test',
  role: 'ADMIN',
  isActive: true,
};

function authValue(role: Role = 'ADMIN'): AuthContextType {
  return {
    user: { ...user, role },
    token: 'jwt',
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };
}

function renderWithAuth(node: React.ReactNode, role: Role = 'ADMIN') {
  return render(
    <AuthContext.Provider value={authValue(role)}>
      <MemoryRouter>{node}</MemoryRouter>
    </AuthContext.Provider>
  );
}

const event: CalendarEventItem = {
  id: 'event-1',
  title: 'Licença Ambiental',
  expirationDate: '2026-08-27T23:30:00.000-03:00',
  status: 'CRITICAL',
  category: { id: 'cat-1', name: 'Licenças', colorHex: null },
};

const auditLog: AuditLogItem = {
  id: 'log-1',
  documentId: 'doc-1',
  userId: 'admin-1',
  userName: 'Ana Admin',
  action: 'UPDATE',
  diffData: {
    title: { old: 'Licença Antiga', new: 'Licença Atualizada' },
    notes: { new: { origem: 'migração' } },
    expirationDate: { old: null },
  },
  timestamp: '2026-08-27T12:00:00.000Z',
  document: { id: 'doc-1', title: 'Licença Ambiental', isArchived: false },
  user: { id: 'admin-1', name: 'Ana Admin', email: 'ana@docsob.test', role: 'ADMIN' },
};

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Calendário — serviços, mês/ano e sync', () => {
  it('envia month/year juntos, usa as rotas relativas e preserva os DTOs reais', async () => {
    apiGet
      .mockResolvedValueOnce({ data: { events: [event] } })
      .mockResolvedValueOnce({ data: { total: 1, page: 2, limit: 10, totalPages: 3, logs: [] } });
    apiPost.mockResolvedValueOnce({ data: { total: 4, synced: 3 } });

    await expect(calendarService.getEvents(2026, 8)).resolves.toEqual([event]);
    await expect(calendarService.syncCalendar()).resolves.toEqual({ total: 4, synced: 3 });
    await expect(calendarService.getSyncLogs(2, 10)).resolves.toMatchObject({ page: 2, totalPages: 3 });

    expect(apiGet).toHaveBeenNthCalledWith(1, '/calendar/events', {
      params: { year: 2026, month: 8 },
    });
    expect(apiPost).toHaveBeenCalledWith('/calendar/sync');
    expect(apiGet).toHaveBeenNthCalledWith(2, '/calendar/sync-logs', {
      params: { page: 2, limit: 10 },
    });
  });

  it('renderiza o evento pela data textual, comunica sync simulado e abre logs somente para ADMIN', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-27T12:00:00.000Z'));
    const getEvents = vi.spyOn(calendarService, 'getEvents').mockResolvedValue([event]);
    vi.spyOn(calendarService, 'syncCalendar').mockResolvedValue({ total: 4, synced: 3 });
    const getSyncLogs = vi.spyOn(calendarService, 'getSyncLogs').mockResolvedValue({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      logs: [
        {
          id: 'sync-1',
          documentId: 'doc-1',
          gcalEventId: 'gcal-local-1',
          status: 'SYNCED',
          lastSyncedAt: '2026-08-27T12:00:00.000Z',
          errorMessage: null,
          document: { id: 'doc-1', title: 'Licença Ambiental' },
        },
      ],
    });

    renderWithAuth(<CalendarPage />);
    await waitFor(() => expect(getEvents).toHaveBeenCalledWith(2026, 8));
    expect(await screen.findByText('Licença Ambiental')).toBeInTheDocument();
    expect(screen.getByText(/Sincronização Simulada \/ Local/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sincronizar com Agenda/i }));
    expect(await screen.findByText(/3 de 4 documento\(s\).*simulado\/local/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Logs de Sync/i }));
    await waitFor(() => expect(getSyncLogs).toHaveBeenCalledWith(1, 10));
    expect(screen.getByRole('dialog', { name: /Logs de Sincronização Google Agenda/i })).toBeInTheDocument();
  });

  it('oculta o modal de logs para OPERATIONAL', async () => {
    vi.spyOn(calendarService, 'getEvents').mockResolvedValue([]);
    renderWithAuth(<CalendarPage />, 'OPERATIONAL');
    await waitFor(() => expect(calendarService.getEvents).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /Logs de Sync/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sincronizar com Agenda/i })).toBeInTheDocument();
  });
});

describe('Auditoria — endpoint, filtros, paginação e diff', () => {
  it('chama /audit-logs (nunca /audit), normaliza autor e torna endDate inclusiva', async () => {
    const response: AuditLogsResponse = { total: 1, page: 2, limit: 15, totalPages: 2, logs: [auditLog] };
    apiGet
      .mockResolvedValueOnce({ data: response })
      .mockResolvedValueOnce({ data: { log: auditLog } });

    await auditService.listLogs({
      page: 2,
      limit: 15,
      action: 'UPDATE',
      search: '  Ana  ',
      startDate: '2026-08-01',
      endDate: '2026-08-27',
    });
    await expect(auditService.getLogById('log-1')).resolves.toEqual(auditLog);

    expect(apiGet).toHaveBeenNthCalledWith(1, '/audit-logs', {
      params: {
        page: 2,
        limit: 15,
        action: 'UPDATE',
        search: 'Ana',
        startDate: '2026-08-01T00:00:00.000Z',
        endDate: '2026-08-27T23:59:59.999Z',
      },
    });
    expect(apiGet).toHaveBeenNthCalledWith(2, '/audit-logs/log-1');
    expect(apiGet.mock.calls.map(([path]) => path)).not.toContain('/audit');
  });

  it('busca por autor com debounce, pagina no servidor e abre o modal de diff', async () => {
    const listLogs = vi.spyOn(auditService, 'listLogs').mockImplementation(async (params = {}) => ({
      total: 2,
      page: params.page ?? 1,
      limit: 15,
      totalPages: 2,
      logs: [auditLog],
    }));
    render(<AuditPage />);

    expect(await screen.findByText('Ana Admin')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Buscar por autor/i), { target: { value: 'Ana' } });
    await waitFor(
      () =>
        expect(listLogs.mock.calls.some(([params]) => params?.search === 'Ana' && params?.page === 1)).toBe(true),
      { timeout: 1500 }
    );

    fireEvent.click(screen.getByRole('button', { name: /Próxima/i }));
    await waitFor(() => expect(listLogs.mock.calls.some(([params]) => params?.page === 2)).toBe(true));

    fireEvent.click(screen.getByRole('button', { name: /Ver detalhes do log/i }));
    expect(screen.getByRole('dialog', { name: /Detalhes do Registro de Auditoria/i })).toBeInTheDocument();
    expect(screen.getByText('Licença Antiga')).toBeInTheDocument();
    expect(screen.getByText('Licença Atualizada')).toBeInTheDocument();
  });

  it('renderiza diff parcial e valores arbitrários de forma defensiva', () => {
    render(
      <AuditDiffViewer
        diffData={{
          title: { old: 'Antes', new: 'Depois' },
          notes: { new: { origem: 'importação' } },
          isArchived: false,
          expirationDate: null,
        }}
      />
    );

    expect(screen.getByText('Antes')).toBeInTheDocument();
    expect(screen.getByText('Depois')).toBeInTheDocument();
    expect(screen.getByText('{"origem":"importação"}')).toBeInTheDocument();
    expect(screen.getByText('Falso')).toBeInTheDocument();
    expect(screen.getByText('(vazio)')).toBeInTheDocument();
  });
});
