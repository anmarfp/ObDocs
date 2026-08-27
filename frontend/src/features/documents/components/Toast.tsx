import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const iconMap = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />,
        };

        const bgMap = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-950',
          error: 'bg-red-50 border-red-200 text-red-950',
          warning: 'bg-amber-50 border-amber-200 text-amber-950',
          info: 'bg-sky-50 border-sky-200 text-sky-950',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl border shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${bgMap[toast.type]}`}
            role="alert"
          >
            <div className="flex items-start space-x-3 min-w-0 mr-2">
              <div className="mt-0.5">{iconMap[toast.type]}</div>
              <div className="text-sm">
                <p className="font-semibold leading-tight">{toast.title}</p>
                {toast.message && (
                  <p className="mt-1 text-xs opacity-90 break-words leading-relaxed">{toast.message}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition flex-shrink-0"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
