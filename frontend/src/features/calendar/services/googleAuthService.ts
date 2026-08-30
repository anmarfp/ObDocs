import api from '@/services/api';
import { GoogleConnectionStatus } from '../types/calendar.types';

/**
 * Fluxo de conexão OAuth por usuário com o Google Agenda (DOC-28, subtarefa 2).
 * A sincronização real dos eventos ainda não usa estes tokens (subtarefa 3) —
 * este service cuida apenas de conectar/status/desconectar.
 */
export const googleAuthService = {
  /**
   * GET /calendar/google/status — indica se o usuário autenticado já conectou
   * sua conta Google. Nunca retorna os valores dos tokens.
   */
  getStatus: async (): Promise<GoogleConnectionStatus> => {
    const response = await api.get<GoogleConnectionStatus>('/calendar/google/status');
    return response.data;
  },

  /**
   * DELETE /calendar/google/status — remove a conexão local (best-effort na
   * revogação junto ao Google).
   */
  disconnect: async (): Promise<GoogleConnectionStatus> => {
    const response = await api.delete<GoogleConnectionStatus>('/calendar/google/status');
    return response.data;
  },

  /**
   * GET /calendar/google/connect — busca a URL de consentimento do Google.
   * Precisa ser uma chamada autenticada via `api` (o backend assina o `state`
   * com o userId do Bearer token), diferente da navegação em si: o retorno
   * desta chamada é passado para `navigateToGoogleConsent`, que faz o
   * redirecionamento de página inteira do navegador até o Google.
   */
  getConnectUrl: async (): Promise<string> => {
    const response = await api.get<{ url: string }>('/calendar/google/connect');
    return response.data.url;
  },
};

/**
 * Navega o navegador (página inteira, não uma chamada de API/XHR) até a URL de
 * consentimento do Google — é necessário um full-page redirect para que a tela
 * de login/consentimento do Google seja exibida, o que uma requisição via
 * `api`/axios não faz.
 */
export function navigateToGoogleConsent(url: string): void {
  window.location.href = url;
}
