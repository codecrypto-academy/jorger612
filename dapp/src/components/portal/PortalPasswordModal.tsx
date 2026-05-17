'use client';

import Link from 'next/link';
import { useState } from 'react';
import { KeyIcon, WalletIcon } from '@heroicons/react/24/outline';
import { validatePassword } from '@/lib/passwordPolicy';

interface PortalPasswordModalProps {
  walletAddress: string;
  displayName?: string;
  loading: boolean;
  error: string | null;
  remainingAttempts?: number;
  maxAttempts?: number;
  onSubmit: (password: string) => Promise<boolean>;
}

export function PortalPasswordModal({
  walletAddress,
  displayName,
  loading,
  error,
  remainingAttempts,
  maxAttempts = 3,
  onSubmit,
}: PortalPasswordModalProps) {
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validatePassword(password);
    if (!check.ok) return;
    await onSubmit(password);
  }

  return (
    <div className="ds-portal-overlay" role="presentation">
      <div
        className="ds-portal-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-login-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ds-portal-modal__icon" aria-hidden>
          <KeyIcon style={{ width: 32, height: 32 }} />
        </div>
        <h2 id="portal-login-title" className="ds-portal-modal__title">
          Acceso al portal
        </h2>
        <p className="ds-portal-modal__lead">
          {displayName ? `Hola ${displayName}, ` : ''}
          ingrese la clave asociada a su wallet para continuar.
        </p>
        {typeof remainingAttempts === 'number' && remainingAttempts < maxAttempts && (
          <p className="ds-portal-modal__hint">
            Intentos restantes antes del bloqueo de 1 h:{' '}
            <strong>{remainingAttempts}</strong> de {maxAttempts}.
          </p>
        )}

        <div className="ds-field" style={{ marginBottom: 16 }}>
          <label className="ds-label">Wallet conectada</label>
          <input
            className="ds-input"
            style={{ maxWidth: '100%', fontFamily: 'var(--ds-font-mono)', fontSize: 13 }}
            value={walletAddress}
            disabled
            readOnly
          />
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div className="ds-field">
            <label className="ds-label" htmlFor="portal-password">
              Clave
            </label>
            <input
              id="portal-password"
              type="password"
              className="ds-input"
              style={{ maxWidth: '100%' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button type="submit" className="ds-portal-modal__cta" disabled={loading}>
            <WalletIcon style={{ width: 20, height: 20 }} aria-hidden />
            {loading ? 'Validando…' : 'Ingresar al portal'}
          </button>
        </form>

        <p className="ds-portal-modal__footer">
          ¿Primera vez?{' '}
          <Link href="/market" className="ds-portal-modal__link">
            Regístrese aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
