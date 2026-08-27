import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import clsx from 'clsx';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Documentos', path: '/documentos', icon: FileText },
  { name: 'Calendário', path: '/calendario', icon: Calendar },
  { name: 'Usuários', path: '/usuarios', icon: Users, adminOnly: true },
  { name: 'Configurações', path: '/configuracoes', icon: Settings, adminOnly: true },
  { name: 'Auditoria', path: '/auditoria', icon: ShieldCheck, adminOnly: true },
];

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.role === 'ADMIN');

  const roleBadgeColor =
    user?.role === 'ADMIN'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-navy-blue/30 text-navy-light border-navy-border/40';

  const roleLabel = user?.role === 'ADMIN' ? 'ADMINISTRADOR' : 'OPERACIONAL';

  return (
    <div className="min-h-screen bg-navy-main flex flex-col md:flex-row text-slate-100 antialiased">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-navy-card border-b border-navy-border/30">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-navy-blue to-navy-light flex items-center justify-center font-bold text-navy-main shadow-md">
            DO
          </div>
          <span className="font-bold text-lg tracking-tight text-white">DocsOb</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-300 hover:bg-navy-main hover:text-white transition-colors"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-navy-card border-r border-navy-border/20 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col flex-1">
          {/* Logo & App Title */}
          <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-navy-border/20">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-navy-blue to-navy-light flex items-center justify-center font-extrabold text-navy-main shadow-lg shadow-navy-blue/20">
              DO
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-white tracking-wide">DocsOb</h1>
              <p className="text-[11px] text-navy-border font-medium mt-1">Gestão de Vencimentos</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-navy-border/70">
              Menu Principal
            </div>
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150',
                      isActive
                        ? 'bg-navy-blue text-white shadow-md shadow-navy-blue/30 font-semibold'
                        : 'text-slate-300 hover:bg-navy-main/80 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-navy-border/20 bg-navy-card/80">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-navy-main/50 border border-navy-border/20">
            <div className="h-9 w-9 rounded-full bg-navy-blue/30 border border-navy-border/40 flex items-center justify-center text-navy-light">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Usuário'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <header className="h-16 px-6 bg-navy-card/50 backdrop-blur-md border-b border-navy-border/20 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Ambiente:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* User Badge */}
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border tracking-wider',
                  roleBadgeColor
                )}
              >
                <Shield className="h-3 w-3" />
                {roleLabel}
              </span>
              <span className="hidden sm:inline text-xs font-medium text-slate-300">{user?.name}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/30 border border-rose-500/30 rounded-lg transition-colors"
              title="Sair do sistema"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-navy-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
