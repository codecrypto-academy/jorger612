'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useIsCuentaAutorizada } from '@/hooks/useIsCuentaAutorizada';
import { AlertaCuentaNoAutorizada } from '@/components/ui/AlertaCuentaNoAutorizada';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { SyncBar } from '@/components/dashboard/SyncBar';
import { DashboardRolesTable } from '@/components/dashboard/DashboardRolesTable';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BlockchainStatus } from '@/components/dashboard/BlockchainStatus';
import { ShieldCheckIcon, WalletIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

function WelcomeCard() {
  const { connect } = useWallet();
  return (
    <div className="ds-container" style={{ animation: 'dsFadeIn 0.35s ease' }}>
      <div className="ds-card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 24px',
            borderRadius: 16,
            background: 'var(--ds-gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          }}
        >
          <ShieldCheckIcon style={{ width: 36, height: 36 }} />
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: '1.75rem', fontWeight: 700, color: 'var(--ds-text-title)' }}>
          Bienvenido
        </h1>
        <p style={{ color: 'var(--ds-text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Conecta MetaMask para acceder al <strong style={{ color: 'var(--ds-accent-start)' }}>centro de control RBAC</strong>{' '}
          en blockchain.
        </p>
        <button type="button" onClick={connect} data-testid="btn-connect-metamask" className="ds-btn" style={{ width: '100%', textTransform: 'none' }}>
          <WalletIcon style={{ width: 20, height: 20 }} /> Conectar con MetaMask
        </button>
        <p style={{ fontSize: 12, color: 'var(--ds-gray-600)', marginTop: 20, marginBottom: 0 }}>
          Necesitas la extensión MetaMask instalada
        </p>
        <Link
          href="/market"
          style={{
            display: 'inline-block',
            marginTop: 14,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ds-accent-start)',
            textDecoration: 'none',
          }}
        >
          Mi Primera Vez
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected, account, isOwner } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const { loading, error, roles, actividad, stats, refresh } = useDashboardData(isConnected);

  if (!isConnected) return <WelcomeCard />;

  return (
    <div className="ds-dashboard" style={{ animation: 'dsFadeIn 0.35s ease' }}>
      {!authLoading && isOwner && !isAuthorized && (
        <div className="ds-alert ds-alert--info" role="alert" style={{ marginBottom: 20, alignItems: 'flex-start' }}>
          <InformationCircleIcon style={{ width: 24, height: 24, flexShrink: 0, color: 'var(--ds-accent-start)', marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Eres el owner del contrato — registra tu cuenta para operar</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6 }}>
              Ve a <Link href="/cuentas">Cuentas autorizadas</Link> y añade tu dirección para gestionar roles, usuarios y menús.
            </p>
          </div>
        </div>
      )}

      {!authLoading && !isOwner && !isAuthorized && <AlertaCuentaNoAutorizada style={{ marginBottom: 20 }} />}

      <div className="ds-dashboard__toolbar">
        <Button variant="secondary" size="sm" onClick={() => void refresh()} disabled={loading}>
          <ArrowPathIcon style={{ width: 16, height: 16, animation: loading ? 'dsSpin 0.8s linear infinite' : undefined }} />
          Actualizar panel
        </Button>
      </div>

      {error && (
        <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <KpiCards stats={stats} loading={loading} />
      <SyncBar stats={stats} />

      <div className="ds-dashboard__grid">
        <DashboardRolesTable roles={roles} loading={loading} />
        <aside className="ds-dashboard__aside">
          <RecentActivity items={actividad} loading={loading} />
          <BlockchainStatus stats={stats} />
        </aside>
      </div>
    </div>
  );
}
