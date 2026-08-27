import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Role } from '@/types/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-navy-main text-navy-light">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-navy-border/30 bg-navy-card/60 p-8 shadow-2xl backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-navy-blue" />
          <p className="text-sm font-medium text-slate-300">Carregando sessão...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
