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
  error: XCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
};

const typeClass: Record<ToastType['type'], string> = {
  success: 'ds-toast--success',
  error: 'ds-toast--error',
  info: 'ds-toast--info',
  warning: 'ds-toast--warning',
};

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: string) => void }) {
  const Icon = icons[toast.type];
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 5000);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  return (
    <div data-testid="toast-item" className={`ds-toast ${typeClass[toast.type]}`} role="alert">
      <Icon style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2 }} />
      <p className="ds-toast__msg">{toast.message}</p>
      <button type="button" onClick={() => onRemove(toast.id)} className="ds-toast__close" aria-label="Cerrar">
        <XMarkIcon style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="ds-toast-host" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
