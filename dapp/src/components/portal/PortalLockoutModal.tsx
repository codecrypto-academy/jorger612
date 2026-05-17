'use client';

import { useEffect, useState } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/outline';

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'unos segundos';
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

interface PortalLockoutModalProps {
  walletAddress: string;
  lockedUntil: string;
  onExpired?: () => void;
}

export function PortalLockoutModal({ walletAddress, lockedUntil, onExpired }: PortalLockoutModalProps) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, new Date(lockedUntil).getTime() - Date.now()),
  );

  useEffect(() => {
    const tick = () => {
      const next = Math.max(0, new Date(lockedUntil).getTime() - Date.now());
      setRemainingMs(next);
      if (next <= 0) onExpired?.();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockedUntil, onExpired]);

  const shortWallet = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  return (
    <div className="ds-portal-overlay" role="presentation">
      <div
        className="ds-portal-modal ds-portal-modal--lockout"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-lockout-title"
      >
        <div className="ds-portal-modal__icon ds-portal-modal__icon--danger" aria-hidden>
          <LockClosedIcon style={{ width: 32, height: 32 }} />
        </div>
        <h2 id="portal-lockout-title" className="ds-portal-modal__title">
          Acceso temporalmente bloqueado
        </h2>
        <p className="ds-portal-modal__lead">
          Se alcanzaron 3 intentos fallidos para la wallet{' '}
          <strong style={{ fontFamily: 'var(--ds-font-mono)' }}>{shortWallet}</strong>.
          Revise su correo registrado; podrá volver a intentar en{' '}
          <strong>{formatRemaining(remainingMs)}</strong>.
        </p>
        <p className="ds-portal-modal__hint">
          Tras el bloqueo, el contador de intentos se reinicia automáticamente.
        </p>
      </div>
    </div>
  );
}
