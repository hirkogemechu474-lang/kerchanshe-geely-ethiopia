'use client';

import { useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onClose: (id: string) => void;
}

const variantStyles: Record<ToastVariant, { bg: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: { bg: 'bg-green-50 border-green-500 dark:bg-green-900/20', icon: CheckCircle, iconColor: 'text-green-600 dark:text-green-400' },
  error:   { bg: 'bg-red-50 border-red-500 dark:bg-red-900/20',       icon: XCircle,     iconColor: 'text-red-600 dark:text-red-400' },
  warning: { bg: 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/20', icon: AlertCircle, iconColor: 'text-yellow-600 dark:text-yellow-400' },
  info:    { bg: 'bg-blue-50 border-blue-500 dark:bg-blue-900/20',   icon: Info,        iconColor: 'text-blue-600 dark:text-blue-400' },
};

export function Toast({ id, message, variant = 'info', duration = 4000, onClose }: ToastProps) {
  const style = variantStyles[variant];
  const Icon = style.icon;

  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg ${style.bg} animate-slide-in`}>
      <Icon className={`flex-shrink-0 ${style.iconColor}`} size={20} />
      <p className="flex-1 text-sm text-gray-900 dark:text-gray-100">{message}</p>
      <button
        onClick={() => onClose(id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 -m-2"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: any[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
