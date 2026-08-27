import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentFilters from '@/features/documents/components/DocumentFilters';
import FileDropzone from '@/features/documents/components/FileDropzone';
import { buildCreateFormData, buildRenewFormData, buildUpdateFormData } from '@/features/documents/utils/formDataHelper';

afterEach(cleanup);

describe('DocumentFilters', () => {
  const props = () => ({ search: '', onSearchChange: vi.fn(), categoryId: '', onCategoryChange: vi.fn(), status: '' as const, onStatusChange: vi.fn(), includeArchived: false, onIncludeArchivedChange: vi.fn(), categories: [{ id: 'cat-1', name: 'Licenças', colorHex: null, description: null }], isAdmin: true, totalCount: 1 });

  it('aplica busca com debounce e filtros de categoria/status', async () => {
    vi.useFakeTimers(); const p = props();
    render(<DocumentFilters {...p} />);
    fireEvent.change(screen.getByPlaceholderText(/buscar por título/i), { target: { value: 'alvará' } });
    expect(p.onSearchChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(350);
    expect(p.onSearchChange).toHaveBeenLastCalledWith('alvará');
    fireEvent.change(screen.getByDisplayValue('Todas as Categorias'), { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByDisplayValue('Todos os Status'), { target: { value: 'CRITICAL' } });
    expect(p.onCategoryChange).toHaveBeenCalledWith('cat-1');
    expect(p.onStatusChange).toHaveBeenCalledWith('CRITICAL');
    vi.useRealTimers();
  });

  it('restringe o toggle de arquivados a ADMIN e encaminha sua alteração', async () => {
    const p = props(); const { rerender } = render(<DocumentFilters {...p} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(p.onIncludeArchivedChange).toHaveBeenCalledWith(true);
    rerender(<DocumentFilters {...p} isAdmin={false} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});

describe('FileDropzone', () => {
  const renderDropzone = () => { const onFileSelect = vi.fn(); render(<FileDropzone selectedFile={null} onFileSelect={onFileSelect} />); return onFileSelect; };
  it('aceita PDF por drop e por interação acessível de teclado', () => {
    const onFileSelect = renderDropzone(); const zone = screen.getByRole('button', { name: /área de upload/i });
    const pdf = new File(['pdf'], 'licenca.pdf', { type: 'application/pdf' });
    fireEvent.drop(zone, { dataTransfer: { files: [pdf] } });
    expect(onFileSelect).toHaveBeenCalledWith(pdf);
    const input = screen.getByLabelText(/upload de anexo/i); const click = vi.spyOn(input, 'click');
    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(click).toHaveBeenCalled();
  });
  it('rejeita formato inválido e arquivo superior a 10 MB', () => {
    const onFileSelect = renderDropzone(); const zone = screen.getByRole('button');
    fireEvent.drop(zone, { dataTransfer: { files: [new File(['x'], 'malware.exe', { type: 'application/octet-stream' })] } });
    expect(screen.getByText(/formato não suportado/i)).toBeInTheDocument();
    fireEvent.drop(zone, { dataTransfer: { files: [new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'grande.pdf', { type: 'application/pdf' })] } });
    expect(screen.getByText(/excede o limite máximo/i)).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });
});

describe('formDataHelper', () => {
  const base = { title: ' Documento ', categoryId: 'cat-1', issueDate: '2026-08-27' };
  it('omite campos opcionais vazios no POST e converte booleanos em strings', () => {
    const fd = buildCreateFormData({ ...base, issuingBody: '', expirationDate: null, responsibleName: null, responsibleEmail: '', isRenewalInProgress: false });
    expect(Object.fromEntries(fd.entries())).toMatchObject({ title: 'Documento', categoryId: 'cat-1', isRenewalInProgress: 'false' });
    expect(fd.has('expirationDate')).toBe(false);
  });
  it('envia strings vazias para limpar campos no PUT e flags de renovação', () => {
    const fd = buildUpdateFormData({ ...base, issuingBody: null, expirationDate: '', responsibleName: '', responsibleEmail: null, notes: '', isRenewalInProgress: true });
    expect(Object.fromEntries(fd.entries())).toMatchObject({ issuingBody: '', expirationDate: '', responsibleName: '', responsibleEmail: '', notes: '', status: 'RENEWAL_IN_PROGRESS', isRenewalInProgress: 'true' });
  });
  it('preserva datas opcionais e anexo no payload de renovação', () => {
    const attachment = new File(['new'], 'novo.jpg', { type: 'image/jpeg' });
    const fd = buildRenewFormData({ issueDate: '2026-09-01', expirationDate: '', notes: '', attachment });
    expect(fd.get('issueDate')).toBe('2026-09-01'); expect(fd.get('expirationDate')).toBe(''); expect(fd.get('attachment')).toBe(attachment);
  });
});
