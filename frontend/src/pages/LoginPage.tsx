import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ShieldCheck, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else if (axios.isAxiosError(error) && error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Falha ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-main flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-navy-blue/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-navy-card/60 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        {/* Header / Logo */}
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-navy-blue to-navy-light text-navy-main font-black text-2xl shadow-xl shadow-navy-blue/20 mb-4">
            DO
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">DocsObs</h2>
          <p className="mt-2 text-sm text-slate-400">
            Gestão Inteligente e Controle de Vencimento de Documentos
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-navy-card/80 backdrop-blur-md border border-navy-border/30 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="border-b border-navy-border/20 pb-4">
            <h3 className="text-lg font-semibold text-white">Acessar Plataforma</h3>
            <p className="text-xs text-slate-400 mt-0.5">Entre com suas credenciais corporativas</p>
          </div>

          {errorMessage && (
            <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-main/80 border border-navy-border/30 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-main/80 border border-navy-border/30 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy-blue focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-navy-blue hover:bg-navy-blue/90 text-white text-sm font-semibold shadow-lg shadow-navy-blue/30 focus:outline-none focus:ring-2 focus:ring-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center border-t border-navy-border/10">
            <p className="text-xs text-slate-500">
              DocsObs &copy; {new Date().getFullYear()} &bull; Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
