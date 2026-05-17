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
  | 'locked'
  | 'authenticated'
  | 'no_portal_account';

export interface PortalAuthStatus {
  hasAccount: boolean;
  hasPassword: boolean;
  requiresPortalLogin: boolean;
  displayName: string;
  email: string;
  isLocked: boolean;
  lockedUntil: string | null;
  remainingAttempts: number;
  maxAttempts: number;
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
        isLocked: false,
        lockedUntil: null,
        remainingAttempts: 3,
        maxAttempts: 3,
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
        isLocked: Boolean(data.isLocked),
        lockedUntil: typeof data.lockedUntil === 'string' ? data.lockedUntil : null,
        remainingAttempts:
          typeof data.remainingAttempts === 'number' ? data.remainingAttempts : 3,
        maxAttempts: typeof data.maxAttempts === 'number' ? data.maxAttempts : 3,
      };
      setStatus(next);

      if (next.requiresPortalLogin && next.isLocked && next.lockedUntil) {
        setPhase('locked');
      } else if (next.requiresPortalLogin) {
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
          if (data.error === 'account_locked' && typeof data.lockedUntil === 'string') {
            setStatus((s) =>
              s
                ? {
                    ...s,
                    isLocked: true,
                    lockedUntil: data.lockedUntil,
                    remainingAttempts: 0,
                  }
                : s,
            );
            setPhase('locked');
            setLoginError(null);
            return false;
          }
          const msg = typeof data.message === 'string' ? data.message : 'Clave incorrecta.';
          setLoginError(msg);
          if (typeof data.remainingAttempts === 'number') {
            setStatus((s) => (s ? { ...s, remainingAttempts: data.remainingAttempts } : s));
          }
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
          isLocked: false,
          lockedUntil: null,
          remainingAttempts: 3,
          maxAttempts: s?.maxAttempts ?? 3,
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

  const handleLockExpired = useCallback(() => {
    void refreshStatus();
  }, [refreshStatus]);

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
    handleLockExpired,
  };
}
