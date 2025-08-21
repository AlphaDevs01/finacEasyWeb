import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextData {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />
  };
  
  return icons[type];
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ 
  toast, 
  onClose 
}) => {
  const bgColors = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
    error: 'bg-accent-50 border-accent-200 dark:bg-accent-900/20 dark:border-accent-700',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
    info: 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-700'
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div className={`max-w-sm w-full ${bgColors[toast.type]} border rounded-2xl shadow-medium pointer-events-auto ring-1 ring-black/5 dark:ring-white/5 overflow-hidden transform transition-all duration-300 ease-in-out animate-slide-down`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ToastIcon type={toast.type} />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{toast.message}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white dark:bg-neutral-700 rounded-xl inline-flex text-neutral-400 hover:text-neutral-500 dark:hover:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              onClick={() => onClose(toast.id)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-0 right-0 z-50 p-6 space-y-4">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={hideToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};