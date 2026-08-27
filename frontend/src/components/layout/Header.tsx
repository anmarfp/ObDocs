import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Calendar,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DO';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isRoleAdmin = user?.role === 'ADMIN';

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Alternar Menu"
          className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-navy-600"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-navy-950 flex items-center justify-center shadow text-navy-100 font-bold text-base transition-transform group-hover:scale-105">
            DO
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base font-bold text-navy-950 leading-tight tracking-tight">DocsOb</span>
            <span className="text-[11px] text-slate-400 font-medium leading-none">Gestão de Vencimentos</span>
          </div>
        </Link>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setProfileDropdownOpen(false);
            }}
            aria-label="Notificações"
            className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 relative transition"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Notificações Recentes</span>
                <span className="text-[11px] font-semibold text-navy-600 bg-navy-50 px-2 py-0.5 rounded-full">
                  3 não lidas
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                <Link
                  to="/documentos"
                  onClick={() => setNotificationsOpen(false)}
                  className="p-3 flex items-start space-x-3 hover:bg-slate-50 transition"
                >
                  <div className="p-2 rounded-lg bg-red-50 text-red-600 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-800">Certidão Federal Vencida</p>
                    <p className="text-slate-500 mt-0.5">O documento venceu há 2 dias. Protocolar renovação.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Há 10 minutos</span>
                  </div>
                </Link>

                <Link
                  to="/documentos"
                  onClick={() => setNotificationsOpen(false)}
                  className="p-3 flex items-start space-x-3 hover:bg-slate-50 transition"
                >
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-800">Licença Ambiental vence em 5 dias</p>
                    <p className="text-slate-500 mt-0.5">Vencimento previsto para 31/08/2026. Órgão: SEMAD.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Há 2 horas</span>
                  </div>
                </Link>

                <Link
                  to="/calendario"
                  onClick={() => setNotificationsOpen(false)}
                  className="p-3 flex items-start space-x-3 hover:bg-slate-50 transition"
                >
                  <div className="p-2 rounded-lg bg-sky-50 text-navy-600 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-800">Google Calendar Sincronizado</p>
                    <p className="text-slate-500 mt-0.5">3 novos eventos de vencimento sincronizados com a agenda.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Hoje às 08:30</span>
                  </div>
                </Link>
              </div>

              <div className="p-2 border-t border-slate-100 text-center">
                <Link
                  to="/notificacoes"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold text-navy-700 hover:text-navy-900 block py-1"
                >
                  Ver todas as notificações &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setProfileDropdownOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-navy-600"
          >
            <div className="w-8 h-8 rounded-lg bg-navy-900 text-navy-100 flex items-center justify-center text-xs font-bold shadow-sm">
              {getInitials(user?.name)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-none">{user?.name || 'Usuário'}</span>
              <span className="text-[10px] font-bold tracking-wider text-navy-600 mt-0.5 uppercase">
                {isRoleAdmin ? 'ADMINISTRADOR' : 'OPERACIONAL'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    isRoleAdmin ? 'bg-navy-100 text-navy-900' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {isRoleAdmin ? 'Perfil: Administrador' : 'Perfil: Operacional'}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/perfil"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-navy-900"
                >
                  <UserIcon className="w-4 h-4 mr-2.5 text-slate-400" />
                  Meu Perfil
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition text-left"
                >
                  <LogOut className="w-4 h-4 mr-2.5 text-red-500" />
                  Sair do Sistema
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
