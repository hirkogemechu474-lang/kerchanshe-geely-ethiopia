/**
 * Admin error alert component
 */

import { XCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
}

export function ErrorAlert({ message, onClose }: ErrorAlertProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <XCircle className="text-red-600 flex-shrink-0" size={20} />
      <p className="flex-1 text-sm text-red-800">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-red-400 hover:text-red-600">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
