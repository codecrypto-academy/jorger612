'use client';

import { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Toast as ToastType } from '@/types';

interface ToastProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircleIcon,
  error:   XCircleIcon,
  info:    InformationCircleIcon,
  warning: ExclamationTriangleIcon,
};

const styles = {
  success: 'border-emerald-500/50 bg-[#0D0F12] text-emerald-400',
  error:   'border-red-500/50 bg-[#0D0F12] text-red-400',
  info:    'border-[#4F7CFF]/50 bg-[#0D0F12] text-blue-400',
  warning: 'border-[#C9A227]/50 bg-[#0D0F12] text-[#D4AF37]',
};

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  const Icon = icons[toast.type];
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  return (
    <div
      data-testid="toast-item"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl shadow-black/40 animate-fadeIn ${styles[toast.type]}`}
      role="alert"
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <p className="text-sm flex-1 font-medium">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity text-inherit">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 w-80" aria-live="polite">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
    </div>
  );
}
