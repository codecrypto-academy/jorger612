'use client';

import Link from 'next/link';
import { useState } from 'react';
import { KeyIcon, WalletIcon } from '@heroicons/react/24/outline';
import { validatePassword } from '@/lib/passwordPolicy';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '');

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
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const check = validatePassword(password);
    if (!check.ok) return;
    await onSubmit(password);
  }

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/market/portal-auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setForgotError(typeof data.message === 'string' ? data.message : 'No se pudo enviar el correo.');
        return;
      }
      setForgotSuccess(
        typeof data.message === 'string'
          ? data.message
          : 'Se ha enviado un correo para restablecer su contraseña.',
      );
    } catch {
      setForgotError('Error de red. Inténtelo de nuevo.');
    } finally {
      setForgotLoading(false);
    }
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
              disabled={loading || forgotLoading}
              required
            />
          </div>

          {error && (
            <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          {forgotError && (
            <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 14 }}>
              {forgotError}
            </div>
          )}

          {forgotSuccess && (
            <div className="ds-alert ds-alert--success" role="status" style={{ marginBottom: 14 }}>
              {forgotSuccess}
            </div>
          )}

          <button type="submit" className="ds-portal-modal__cta" disabled={loading || forgotLoading}>
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
        <p className="ds-portal-modal__footer" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="ds-portal-modal__link-btn"
            onClick={(e) => void handleForgotPassword(e)}
            disabled={forgotLoading || loading}
          >
            {forgotLoading ? 'Enviando correo…' : 'Olvidé mi contraseña'}
          </button>
        </p>
      </div>
    </div>
  );
}
