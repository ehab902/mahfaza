import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    type: ToastType,
    title: string,
    message: string,
    duration: number = 5000
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback(
    (title: string, message: string, duration?: number) =>
      showToast('success', title, message, duration),
    [showToast]
  );

  const error = useCallback(
    (title: string, message: string, duration?: number) =>
      showToast('error', title, message, duration),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message: string, duration?: number) =>
      showToast('warning', title, message, duration),
    [showToast]
  );

  const info = useCallback(
    (title: string, message: string, duration?: number) =>
      showToast('info', title, message, duration),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const config = {
    success: {
      icon: CheckCircle,
      bgGradient: 'from-green-500/95 to-emerald-500/95',
      iconColor: 'text-white',
      textColor: 'text-white',
      borderColor: 'border-green-400/30'
    },
    error: {
      icon: XCircle,
      bgGradient: 'from-red-500/95 to-rose-500/95',
      iconColor: 'text-white',
      textColor: 'text-white',
      borderColor: 'border-red-400/30'
    },
    warning: {
      icon: AlertCircle,
      bgGradient: 'from-amber-500/95 to-orange-500/95',
      iconColor: 'text-white',
      textColor: 'text-white',
      borderColor: 'border-amber-400/30'
    },
    info: {
      icon: Info,
      bgGradient: 'from-blue-500/95 to-cyan-500/95',
      iconColor: 'text-white',
      textColor: 'text-white',
      borderColor: 'border-blue-400/30'
    }
  };

  const style = config[toast.type];
  const Icon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="pointer-events-auto"
    >
      <div
        className={`bg-gradient-to-r ${style.bgGradient} backdrop-blur-xl rounded-2xl shadow-2xl border-2 ${style.borderColor} p-4 flex items-start gap-3 min-w-[320px]`}
      >
        <div className={`flex-shrink-0 ${style.iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-base ${style.textColor} mb-1`}>
            {toast.title}
          </h4>
          <p className={`text-sm ${style.textColor} opacity-90`}>
            {toast.message}
          </p>
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className={`flex-shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors ${style.iconColor}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
