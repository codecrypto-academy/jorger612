'use client';

import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useIsCuentaAutorizada } from '@/hooks/useIsCuentaAutorizada';
import { AlertaCuentaNoAutorizada } from '@/components/ui/AlertaCuentaNoAutorizada';
import { useDashboardData } from '@/hooks/useDashboardData';
import { usePortalAuthContext } from '@/context/PortalAuthContext';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { SyncBar } from '@/components/dashboard/SyncBar';
import { DashboardRolesTable } from '@/components/dashboard/DashboardRolesTable';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { BlockchainStatus } from '@/components/dashboard/BlockchainStatus';
import { InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { RbacLanding } from '@/components/landing/RbacLanding';

export default function DashboardPage() {
  const { isConnected, account, isOwner } = useWallet();
  const { portalReady } = usePortalAuthContext();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const dashboardEnabled = isConnected && !!account && portalReady;
  const { loading, error, errorLevel, roles, actividad, stats, refresh } = useDashboardData(
    dashboardEnabled ? account : null,
  );

  if (!isConnected) return <RbacLanding />;

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
        <div
          className={`ds-alert ${errorLevel === 'warning' ? 'ds-alert--warning' : 'ds-alert--danger'}`}
          role="alert"
          style={{ marginBottom: 16 }}
        >
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
