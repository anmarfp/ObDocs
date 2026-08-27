import { useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../components/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 5000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastSuccess = useCallback(
    (title: string, message?: string) => addToast('success', title, message),
    [addToast]
  );

  const toastError = useCallback(
    (title: string, message?: string) => addToast('error', title, message),
    [addToast]
  );

  const toastWarning = useCallback(
    (title: string, message?: string) => addToast('warning', title, message),
    [addToast]
  );

  const toastInfo = useCallback(
    (title: string, message?: string) => addToast('info', title, message),
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    toastSuccess,
    toastError,
    toastWarning,
    toastInfo,
  };
}
