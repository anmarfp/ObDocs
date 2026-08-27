import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';

import { LoginPage } from '@/pages/LoginPage';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DocumentosPage } from '@/pages/DocumentosPage';
import { CalendarioPage } from '@/pages/CalendarioPage';
import { UsuariosPage } from '@/pages/UsuariosPage';
import { ConfiguracoesPage } from '@/pages/ConfiguracoesPage';
import { AuditoriaPage } from '@/pages/AuditoriaPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Rotas Protegidas (Exigem Autenticação) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Acessíveis a ADMIN e OPERATIONAL */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />

          {/* Acessíveis Apenas a ADMIN (RBAC) */}
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <ConfiguracoesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuditoriaPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Rota Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
