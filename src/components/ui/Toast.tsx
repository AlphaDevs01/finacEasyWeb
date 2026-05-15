import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastContextData {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-primary-500" />,
    error: <XCircle className="h-5 w-5 text-accent-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-secondary-500" />,
  };

  return icons[type];
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({
  toast,
  onClose,
}) => {
  const bgColors = {
    success: 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-700',
    error: 'bg-accent-50 border-accent-200 dark:bg-accent-900/20 dark:border-accent-700',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
    info: 'bg-secondary-50 border-secondary-200 dark:bg-secondary-900/20 dark:border-secondary-700',
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration ?? 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      className={`w-full max-w-[360px] ${bgColors[toast.type]} border rounded-2xl shadow-strong pointer-events-auto ring-1 ring-black/5 dark:ring-white/5 overflow-hidden animate-slide-down backdrop-blur-sm`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            {toast.icon || <ToastIcon type={toast.type} />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 break-words">
              {toast.title}
            </p>

            {toast.message && (
              <p className="mt-1 text-sm leading-5 text-neutral-600 dark:text-neutral-400 break-words">
                {toast.message}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Close"
            className="flex-shrink-0 rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => onClose(toast.id)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      <div className="fixed right-3 top-3 z-[9999] flex w-[calc(100vw-24px)] max-w-[360px] flex-col gap-3 sm:right-4 sm:top-4">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onClose={hideToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};