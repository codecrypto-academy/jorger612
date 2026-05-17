'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useWallet } from '@/context/WalletContext';
import { usePortalAuth, type PortalAuthPhase } from '@/hooks/usePortalAuth';
import { PortalPasswordModal } from '@/components/portal/PortalPasswordModal';
import { PortalLockoutModal } from '@/components/portal/PortalLockoutModal';
import { PortalWelcomeModal } from '@/components/portal/PortalWelcomeModal';

interface PortalAuthContextValue {
  phase: PortalAuthPhase;
  portalReady: boolean;
  displayName: string;
}

const PortalAuthContext = createContext<PortalAuthContextValue>({
  phase: 'idle',
  portalReady: true,
  displayName: '',
});

export function PortalAuthProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const { account } = useWallet();
  const {
    phase,
    status,
    showWelcome,
    loginError,
    loginLoading,
    portalReady,
    login,
    dismissWelcome,
    handleLockExpired,
  } = usePortalAuth(account, enabled);

  let content: ReactNode = children;

  if (enabled && account) {
    if (phase === 'checking') {
      content = (
        <div className="ds-portal-checking">
          <div className="ds-portal-checking__card">
            <p>Verificando cuenta en el sistema…</p>
          </div>
        </div>
      );
    } else if (phase === 'locked' && status?.lockedUntil) {
      content = (
        <PortalLockoutModal
          walletAddress={account}
          lockedUntil={status.lockedUntil}
          onExpired={handleLockExpired}
        />
      );
    } else if (phase === 'needs_password') {
      content = (
        <PortalPasswordModal
          walletAddress={account}
          displayName={status?.displayName}
          loading={loginLoading}
          error={loginError}
          remainingAttempts={status?.remainingAttempts}
          maxAttempts={status?.maxAttempts}
          onSubmit={login}
        />
      );
    } else {
      content = (
        <>
          <div className={showWelcome ? 'ds-portal-content--locked' : undefined} aria-hidden={showWelcome}>
            {children}
          </div>
          {showWelcome && phase === 'authenticated' && (
            <PortalWelcomeModal
              displayName={status?.displayName}
              walletAddress={account}
              onContinue={dismissWelcome}
            />
          )}
        </>
      );
    }
  }

  return (
    <PortalAuthContext.Provider
      value={{
        phase,
        portalReady,
        displayName: status?.displayName ?? '',
      }}
    >
      {content}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuthContext() {
  return useContext(PortalAuthContext);
}
