import { useEffect, useState } from 'react';
import { formatAddress } from '../utils/format';

export function NotificationToast({ notification, onDismiss, duration = 5000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  if (!notification || !visible) return null;

  return (
    <div
      role="alert"
      className="animate-slide-up fixed bottom-6 right-6 z-50 max-w-sm rounded-xl bg-elite-slate border border-elite-gold/40 shadow-elite p-4 flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-elite-gold/20 flex items-center justify-center flex-shrink-0">
        <span className="text-elite-gold text-lg">&#9993;</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-premium-pearl text-sm">Mensaje nuevo</p>
        <p className="text-elite-silver text-xs mt-0.5">
          De {formatAddress(notification.sender)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        className="text-elite-silver hover:text-premium-pearl text-sm"
        aria-label="Cerrar"
      >
        &times;
      </button>
    </div>
  );
}
