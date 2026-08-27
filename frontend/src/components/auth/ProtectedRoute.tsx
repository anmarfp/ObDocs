import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/auth';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-navy-900 border border-navy-400/40 flex items-center justify-center shadow-glow animate-pulse">
            <span className="text-2xl font-black text-navy-100 tracking-wider">DO</span>
          </div>
          <div className="flex items-center space-x-2 text-navy-100">
            <Loader2 className="w-5 h-5 animate-spin text-navy-400" />
            <span className="text-sm font-medium tracking-wide">Carregando DocsOb...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-card text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-950">Acesso Restrito (403)</h2>
            <p className="text-sm text-slate-500 mt-2">
              Seu perfil de acesso (<span className="font-semibold text-navy-700">{user.role}</span>) não possui permissão para visualizar esta página.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-navy-900 hover:bg-navy-700 rounded-lg shadow transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Início
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
