import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Bell,
  ShieldCheck,
  Users,
  Settings,
  FileCheck2,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItemClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'bg-navy-600 text-white shadow-md font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-navy-900/80'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-navy-950 text-slate-200 flex flex-col border-r border-navy-900/50 shadow-2xl transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navegação Principal
            </div>
            <NavLink to="/" end className={navItemClasses} onClick={() => onClose()}>
              <LayoutDashboard className="w-4 h-4 mr-3 text-navy-400" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink to="/documentos" className={navItemClasses} onClick={() => onClose()}>
              <FileText className="w-4 h-4 mr-3 text-navy-400" />
              <span>Documentos</span>
            </NavLink>

            <NavLink to="/calendario" className={navItemClasses} onClick={() => onClose()}>
              <Calendar className="w-4 h-4 mr-3 text-navy-400" />
              <span>Agenda & Google Sync</span>
            </NavLink>

            <NavLink to="/notificacoes" className={navItemClasses} onClick={() => onClose()}>
              <Bell className="w-4 h-4 mr-3 text-navy-400" />
              <span>Notificações</span>
            </NavLink>

            {isAdmin && (
              <NavLink to="/auditoria" className={navItemClasses} onClick={() => onClose()}>
                <ShieldCheck className="w-4 h-4 mr-3 text-navy-400" />
                <span>Trilha de Auditoria</span>
              </NavLink>
            )}
          </div>

          {/* Admin Tools Section */}
          {isAdmin && (
            <div className="space-y-1 pt-2 border-t border-navy-900/60">
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Administração
              </div>

              <NavLink to="/usuarios" className={navItemClasses} onClick={() => onClose()}>
                <Users className="w-4 h-4 mr-3 text-navy-400" />
                <span>Usuários & Papéis</span>
              </NavLink>

              <NavLink to="/configuracoes" className={navItemClasses} onClick={() => onClose()}>
                <Settings className="w-4 h-4 mr-3 text-navy-400" />
                <span>Configurações</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-navy-900/80 bg-navy-950/70">
          <div className="p-2.5 rounded-xl bg-navy-900/60 border border-navy-800/60 flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-navy-600/30 text-navy-100 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4 text-navy-100" />
            </div>
            <div className="text-[11px] overflow-hidden">
              <p className="font-semibold text-white truncate">DocsObs v1.0</p>
              <p className="text-[10px] text-navy-400">Status 100% Online</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
