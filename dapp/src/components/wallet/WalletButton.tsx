'use client';

import { useWallet } from '@/context/WalletContext';
import { WalletIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CHAIN_ID } from '@/lib/contract';

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface WalletButtonProps {
  variant?: 'default' | 'landing';
}

export function WalletButton({ variant = 'default' }: WalletButtonProps) {
  const { account, chainId, isConnected, isOwner, connect, disconnect, switchToTargetChain, error } = useWallet();
  const wrongChain = isConnected && chainId != null && chainId !== CHAIN_ID;
  const landing = variant === 'landing';

  const connectClass = landing
    ? 'ds-btn ds-btn--sm'
    : 'ds-btn ds-btn--sm';

  if (!isConnected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <button type="button" onClick={connect} data-testid="btn-connect-wallet" className={connectClass}>
          <WalletIcon style={{ width: 16, height: 16 }} />
          {landing ? 'Connect Wallet' : 'Conectar Wallet'}
        </button>
        {error && (
          <p style={{ fontSize: 11, color: 'var(--ds-error-text)', maxWidth: 220, textAlign: 'right', fontWeight: 600, margin: 0 }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  if (wrongChain) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}
        className="wrong-chain-wrap"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(220, 53, 69, 0.45)',
            background: 'var(--ds-error-bg)',
            color: 'var(--ds-error-text)',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <ExclamationTriangleIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
          <span>Red incorrecta (esperado: chainId {CHAIN_ID})</span>
        </div>
        <button type="button" onClick={() => void switchToTargetChain()} data-testid="btn-switch-network" className="ds-btn ds-btn--sm">
          Cambiar red
        </button>
        {error && (
          <p style={{ fontSize: 11, color: 'var(--ds-error-text)', maxWidth: 220, textAlign: 'right', fontWeight: 600, margin: 0 }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {isOwner && (
        <span
          className="ds-badge ds-badge--info"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(12, 84, 96, 0.25)' }}
        >
          <CheckCircleIcon style={{ width: 14, height: 14 }} />
          Admin
        </span>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid var(--ds-border)',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#20c997',
            boxShadow: '0 0 0 2px rgba(32, 201, 151, 0.35)',
          }}
        />
        <span data-testid="wallet-address" style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ds-text-title)' }}>
          {shortAddr(account!)}
        </span>
      </div>
      <button type="button" onClick={disconnect} data-testid="btn-disconnect-wallet" className="ds-btn ds-btn--ghost ds-btn--sm">
        Desconectar
      </button>
    </div>
  );
}
