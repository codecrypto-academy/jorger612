'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useWallet } from '@/context/WalletContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

type FormState = {
  walletAddress: string;
  nombreApellido: string;
  email: string;
  confirmEmail: string;
  telefono: string;
  descripcionAplicacion: string;
};

const initial: FormState = {
  walletAddress: '',
  nombreApellido: '',
  email: '',
  confirmEmail: '',
  telefono: '',
  descripcionAplicacion: '',
};

export default function MarketPage() {
  const { account } = useWallet();
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (account) {
      setForm((f) => ({ ...f, walletAddress: account }));
    }
  }, [account]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const walletAddress = form.walletAddress.trim();
    const email = form.email.trim();
    const confirmEmail = form.confirmEmail.trim();

    if (!walletAddress) {
      setError('La dirección de wallet es obligatoria.');
      return;
    }
    if (!ethers.isAddress(walletAddress)) {
      setError('La dirección de wallet no es válida.');
      return;
    }
    if (!email) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    if (!confirmEmail) {
      setError('Debe confirmar el correo electrónico.');
      return;
    }
    if (email.toLowerCase() !== confirmEmail.toLowerCase()) {
      setError('Los correos electrónicos no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25_000);
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/market/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          nombreApellido: form.nombreApellido.trim() || undefined,
          email,
          telefono: form.telefono.trim() || undefined,
          descripcionAplicacion: form.descripcionAplicacion.trim() || undefined,
        }),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo enviar el formulario.');
        return;
      }
      setSuccess(true);
      setForm(initial);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(
          'La petición tardó demasiado. Compruebe que la API está en marcha y que el puerto coincide con next.config (API_REWRITE_TARGET o PORT en api/.env).',
        );
      } else {
        setError('Error de red. Inténtelo de nuevo más tarde.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ds-container" style={{ animation: 'dsFadeIn 0.35s ease', paddingBottom: 40 }}>
      <div className="ds-card" style={{ maxWidth: 520, margin: '0 auto' }}>
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
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
            }}
          >
            <ShieldCheckIcon style={{ width: 30, height: 30 }} />
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ds-text-title)' }}>Market</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
            Complete el formulario para solicitar acceso al registro de su RBAC.
          </p>
        </div>

        {success ? (
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
            <p style={{ margin: 0, fontWeight: 600 }}>Envío recibido</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.55 }}>
              Una vez haga el envío de este formulario en un plazo de tres días recibirá un correo electrónico para que pueda iniciar con el uso del registro de su RBAC.
            </p>
          </div>
        ) : (
          <p
            style={{
              margin: '0 0 20px',
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--ds-gray-700)',
              padding: '12px 14px',
              borderRadius: 'var(--ds-radius-input)',
              background: 'var(--ds-bg-soft)',
            }}
          >
            Una vez haga el envío de este formulario en un plazo de tres días recibirá un correo electrónico para que pueda iniciar con el uso del registro de su RBAC.
          </p>
        )}

        {!success && (
          <form onSubmit={onSubmit} noValidate>
            <div className="ds-field">
              <label className="ds-label" htmlFor="market-wallet">Dirección de wallet *</label>
              <input
                id="market-wallet"
                className="ds-input"
                style={{ maxWidth: '100%' }}
                value={form.walletAddress}
                onChange={(e) => update('walletAddress', e.target.value)}
                placeholder="0x…"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="market-nombre">Nombre y apellido</label>
              <input
                id="market-nombre"
                className="ds-input"
                style={{ maxWidth: '100%' }}
                value={form.nombreApellido}
                onChange={(e) => update('nombreApellido', e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="market-email">Correo electrónico *</label>
              <input
                id="market-email"
                type="email"
                className="ds-input"
                style={{ maxWidth: '100%' }}
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="market-email2">Confirmar correo electrónico *</label>
              <input
                id="market-email2"
                type="email"
                className="ds-input"
                style={{ maxWidth: '100%' }}
                value={form.confirmEmail}
                onChange={(e) => update('confirmEmail', e.target.value)}
                autoComplete="off"
              />
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ds-gray-600)' }}>
                Solo se usa en esta pantalla para validar que escribió bien su correo.
              </p>
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="market-tel">Teléfono</label>
              <input
                id="market-tel"
                type="tel"
                className="ds-input"
                style={{ maxWidth: '100%' }}
                value={form.telefono}
                onChange={(e) => update('telefono', e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="market-desc">Breve descripción de la aplicación que dará a RBAC</label>
              <textarea
                id="market-desc"
                className="ds-input"
                style={{ maxWidth: '100%', minHeight: 100, resize: 'vertical' }}
                value={form.descripcionAplicacion}
                onChange={(e) => update('descripcionAplicacion', e.target.value)}
                rows={4}
              />
            </div>

            {error && (
              <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" className="ds-btn" disabled={submitting} style={{ width: '100%', textTransform: 'none' }}>
              {submitting ? 'Enviando…' : 'Enviar solicitud'}
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
