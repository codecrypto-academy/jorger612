'use client';

import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface PortalWelcomeModalProps {
  displayName?: string;
  walletAddress: string;
  onContinue: () => void;
}

export function PortalWelcomeModal({ displayName, walletAddress, onContinue }: PortalWelcomeModalProps) {
  const shortWallet = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;

  return (
    <div className="ds-portal-overlay ds-portal-overlay--welcome" role="presentation">
      <div className="ds-portal-modal ds-portal-modal--welcome" role="dialog" aria-modal="true" aria-labelledby="portal-welcome-title">
        <div className="ds-portal-welcome__badge" aria-hidden>
          <SparklesIcon style={{ width: 28, height: 28 }} />
        </div>
        <CheckCircleIcon className="ds-portal-welcome__check" aria-hidden />
        <h2 id="portal-welcome-title" className="ds-portal-modal__title">
          ¡Bienvenido{displayName ? `, ${displayName}` : ''}!
        </h2>
        <p className="ds-portal-modal__lead">
          Acceso verificado para la wallet <strong style={{ fontFamily: 'var(--ds-font-mono)' }}>{shortWallet}</strong>.
          Ya puede usar el centro de control RBAC.
        </p>
        <button type="button" className="ds-portal-modal__cta" onClick={onContinue}>
          Continuar al panel
        </button>
      </div>
    </div>
  );
}
