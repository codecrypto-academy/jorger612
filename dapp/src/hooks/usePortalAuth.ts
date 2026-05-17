'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import {
  clearPortalAuthSession,
  isPortalSessionValidForWallet,
  readPortalAuthSession,
  writePortalAuthSession,
} from '@/lib/portalAuthSession';

export type PortalAuthPhase =
  | 'idle'
  | 'checking'
  | 'needs_password'
  | 'authenticated'
  | 'no_portal_account';

export interface PortalAuthStatus {
  hasAccount: boolean;
  hasPassword: boolean;
  requiresPortalLogin: boolean;
  displayName: string;
  email: string;
}

export function usePortalAuth(account: string | null, enabled: boolean) {
  const [phase, setPhase] = useState<PortalAuthPhase>('idle');
  const [status, setStatus] = useState<PortalAuthStatus | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!enabled || !account) {
      setPhase('idle');
      setStatus(null);
      setShowWelcome(false);
      return;
    }

    if (isPortalSessionValidForWallet(account)) {
      const session = readPortalAuthSession();
      setStatus({
        hasAccount: true,
        hasPassword: true,
        requiresPortalLogin: true,
        displayName: session?.displayName ?? '',
        email: '',
      });
      setPhase('authenticated');
      return;
    }

    setPhase('checking');
    try {
      const data = await apiGet(
        `/market/portal-auth/status?wallet=${encodeURIComponent(account)}`,
      );
      const next: PortalAuthStatus = {
        hasAccount: Boolean(data.hasAccount),
        hasPassword: Boolean(data.hasPassword),
        requiresPortalLogin: Boolean(data.requiresPortalLogin),
        displayName: typeof data.displayName === 'string' ? data.displayName : '',
        email: typeof data.email === 'string' ? data.email : '',
      };
      setStatus(next);

      if (next.requiresPortalLogin) {
        setPhase('needs_password');
      } else {
        setPhase('no_portal_account');
      }
    } catch {
      setStatus(null);
      setPhase('no_portal_account');
    }
  }, [account, enabled]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!account) {
      clearPortalAuthSession();
      setShowWelcome(false);
      setLoginError(null);
    }
  }, [account]);

  const login = useCallback(
    async (password: string) => {
      if (!account) return false;
      setLoginLoading(true);
      setLoginError(null);
      try {
        const res = await fetch(
          `${(process.env.NEXT_PUBLIC_API_URL ?? '/api').replace(/\/$/, '')}/market/portal-auth/login`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress: account, password }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setLoginError(typeof data.message === 'string' ? data.message : 'Clave incorrecta.');
          return false;
        }
        writePortalAuthSession({
          wallet: account.toLowerCase(),
          verifiedAt: new Date().toISOString(),
          displayName: typeof data.nombreApellido === 'string' ? data.nombreApellido : undefined,
        });
        setStatus((s) => ({
          hasAccount: true,
          hasPassword: true,
          requiresPortalLogin: true,
          displayName: typeof data.nombreApellido === 'string' ? data.nombreApellido : s?.displayName ?? '',
          email: typeof data.email === 'string' ? data.email : s?.email ?? '',
        }));
        setPhase('authenticated');
        setShowWelcome(true);
        return true;
      } catch {
        setLoginError('Error de red. Inténtelo de nuevo.');
        return false;
      } finally {
        setLoginLoading(false);
      }
    },
    [account],
  );

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
  }, []);

  const portalReady =
    !enabled ||
    !account ||
    phase === 'authenticated' ||
    phase === 'no_portal_account' ||
    (status !== null && !status.requiresPortalLogin);

  return {
    phase,
    status,
    showWelcome,
    loginError,
    loginLoading,
    portalReady,
    login,
    dismissWelcome,
    refreshStatus,
  };
}
