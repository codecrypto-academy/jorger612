'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';
import { PASSWORD_RULES_LIST, validatePasswordPair } from '@/lib/passwordPolicy';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function EstablecerClaveForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setInfoError('Falta el enlace de activación. Abra el correo y use el botón «Establecer mi clave».');
      setLoadingInfo(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingInfo(true);
      setInfoError(null);
      try {
        const res = await fetch(
          `${API_BASE.replace(/\/$/, '')}/market/password-setup?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setInfoError(typeof data.message === 'string' ? data.message : 'Enlace no válido.');
          return;
        }
        setWalletAddress(typeof data.walletAddress === 'string' ? data.walletAddress : null);
      } catch {
        if (!cancelled) setInfoError('No se pudo validar el enlace. Inténtelo más tarde.');
      } finally {
        if (!cancelled) setLoadingInfo(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!token) return;

    const check = validatePasswordPair(password, passwordConfirm);
    if (!check.ok) {
      setSubmitError(check.message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/market/password-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          passwordConfirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(typeof data.message === 'string' ? data.message : 'No se pudo guardar la clave.');
        return;
      }
      setSuccess(true);
    } catch {
      setSubmitError('Error de red. Inténtelo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ds-container" style={{ animation: 'dsFadeIn 0.35s ease', paddingBottom: 40 }}>
      <div className="ds-card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 14,
              background: 'var(--ds-gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <KeyIcon style={{ width: 28, height: 28 }} />
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ds-text-title)' }}>
            Establecer clave de acceso
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
            Defina la clave asociada a su wallet para acceder al RBAC.
          </p>
        </div>

        {loadingInfo && (
          <p className="ds-muted" style={{ textAlign: 'center' }}>
            Validando enlace…
          </p>
        )}

        {infoError && !loadingInfo && (
          <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 16 }}>
            {infoError}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: '14px 16px',
              borderRadius: 'var(--ds-radius-input)',
              background: 'var(--ds-success-bg)',
              color: 'var(--ds-success-text)',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Clave guardada</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55 }}>
              Su clave quedó registrada para la wallet indicada. En una próxima fase podrá usarla para iniciar sesión.
            </p>
          </div>
        )}

        {!loadingInfo && !infoError && !success && walletAddress && (
          <form onSubmit={onSubmit} noValidate>
            <div className="ds-field">
              <label className="ds-label" htmlFor="setup-wallet">
                Wallet asignada
              </label>
              <input
                id="setup-wallet"
                className="ds-input"
                style={{ maxWidth: '100%', fontFamily: 'var(--ds-font-mono)', fontSize: 13 }}
                value={walletAddress}
                disabled
                readOnly
                aria-readonly="true"
              />
            </div>
            <div
              style={{
                marginBottom: 16,
                padding: '12px 14px',
                borderRadius: 'var(--ds-radius-input)',
                background: 'var(--ds-bg-soft)',
                border: '1px solid var(--ds-border)',
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--ds-text-title)' }}>
                Requisitos de la clave
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--ds-gray-700)', lineHeight: 1.65 }}>
                {PASSWORD_RULES_LIST.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="setup-password">
                Clave
              </label>
              <input
                id="setup-password"
                type="password"
                className="ds-input"
                style={{ maxWidth: '100%' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                maxLength={128}
                pattern="[A-Za-z0-9]*"
                title="Solo letras y números"
                required
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="setup-password2">
                Verificar clave
              </label>
              <input
                id="setup-password2"
                type="password"
                className="ds-input"
                style={{ maxWidth: '100%' }}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                maxLength={128}
                pattern="[A-Za-z0-9]*"
                title="Solo letras y números"
                required
              />
            </div>

            {submitError && (
              <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 16 }}>
                {submitError}
              </div>
            )}

            <button type="submit" className="ds-btn" disabled={submitting} style={{ width: '100%', textTransform: 'none' }}>
              {submitting ? 'Guardando…' : 'Guardar clave'}
            </button>
          </form>
        )}

        <p style={{ marginTop: 24, marginBottom: 0, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ds-accent-start)', textDecoration: 'none' }}>
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EstablecerClavePage() {
  return (
    <Suspense
      fallback={
        <div className="ds-container" style={{ padding: 40, textAlign: 'center' }}>
          <ShieldCheckIcon style={{ width: 40, height: 40, color: 'var(--ds-accent-start)', margin: '0 auto' }} />
          <p className="ds-muted" style={{ marginTop: 16 }}>
            Cargando…
          </p>
        </div>
      }
    >
      <EstablecerClaveForm />
    </Suspense>
  );
}
