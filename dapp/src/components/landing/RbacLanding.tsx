'use client';

import Link from 'next/link';
import {
  ShieldCheckIcon,
  WalletIcon,
  CubeIcon,
  ArrowPathIcon,
  SignalIcon,
  KeyIcon,
  UserGroupIcon,
  EyeIcon,
  ServerStackIcon,
} from '@heroicons/react/24/outline';
import { useWallet } from '@/context/WalletContext';
import { useLandingStatus } from '@/hooks/useLandingStatus';
import { LandingShield } from '@/components/landing/LandingShield';

const FEATURES = [
  { icon: KeyIcon, text: 'Control de acceso basado en roles (RBAC)' },
  { icon: UserGroupIcon, text: 'Identidades verificadas on-chain' },
  { icon: EyeIcon, text: 'Transparencia y auditoría en tiempo real' },
  { icon: ServerStackIcon, text: 'Infraestructura segura y descentralizada' },
] as const;

function SystemStatusCard() {
  const { status } = useLandingStatus(true);

  return (
    <div className="ds-rbac-landing__status" role="status" aria-live="polite">
      <div className="ds-rbac-landing__status-head">
        <span className="ds-rbac-landing__status-label">Estado del sistema</span>
        <span
          className={`ds-rbac-landing__badge${status.operational ? ' ds-rbac-landing__badge--ok' : ' ds-rbac-landing__badge--warn'}`}
        >
          {status.loading ? 'Comprobando…' : status.operational ? 'Operativo' : 'Sin conexión'}
        </span>
      </div>
      <div className="ds-rbac-landing__status-grid">
        <div className="ds-rbac-landing__stat">
          <SignalIcon className="ds-rbac-landing__stat-icon" aria-hidden />
          <div>
            <span className="ds-rbac-landing__stat-k">Red</span>
            <span className="ds-rbac-landing__stat-v">{status.networkName}</span>
          </div>
        </div>
        <div className="ds-rbac-landing__stat">
          <CubeIcon className="ds-rbac-landing__stat-icon" aria-hidden />
          <div>
            <span className="ds-rbac-landing__stat-k">Último bloque</span>
            <span className="ds-rbac-landing__stat-v">
              {status.lastBlock != null ? status.lastBlock.toLocaleString('es') : '—'}
            </span>
          </div>
        </div>
        <div className="ds-rbac-landing__stat">
          <ArrowPathIcon className="ds-rbac-landing__stat-icon" aria-hidden />
          <div>
            <span className="ds-rbac-landing__stat-k">Sincronización</span>
            <span className="ds-rbac-landing__stat-v">{status.operational ? status.agoLabel : '—'}</span>
          </div>
        </div>
      </div>
      {status.error && (
        <p className="ds-rbac-landing__status-error" role="alert">
          {status.error}
        </p>
      )}
    </div>
  );
}

export function RbacLanding() {
  const { connect } = useWallet();

  return (
    <div className="ds-rbac-landing">
      <div className="ds-rbac-landing__grid">
        <section className="ds-rbac-landing__hero">
          <h1 className="ds-rbac-landing__title">
            Seguridad, identidad y control{' '}
            <span className="ds-rbac-landing__title-accent">descentralizado</span>
          </h1>
          <p className="ds-rbac-landing__lead">
            Conecta tu wallet para acceder al centro de control RBAC y gestionar roles, usuarios y permisos con
            total seguridad sobre blockchain.
          </p>
          <ul className="ds-rbac-landing__features">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className="ds-rbac-landing__feature-icon" aria-hidden>
                  <Icon style={{ width: 18, height: 18 }} />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <SystemStatusCard />
        </section>

        <div className="ds-rbac-landing__shield-col">
          <LandingShield />
        </div>

        <aside className="ds-rbac-landing__connect">
          <div className="ds-rbac-landing__card">
            <div className="ds-rbac-landing__card-icon" aria-hidden>
              <ShieldCheckIcon style={{ width: 32, height: 32 }} />
            </div>
            <h2 className="ds-rbac-landing__card-title">Bienvenido</h2>
            <p className="ds-rbac-landing__card-text">
              Conecta tu wallet para acceder al{' '}
              <strong className="ds-rbac-landing__card-em">centro de control RBAC</strong> en blockchain.
            </p>
            <button
              type="button"
              onClick={connect}
              data-testid="btn-connect-metamask"
              className="ds-rbac-landing__cta"
            >
              <WalletIcon style={{ width: 22, height: 22 }} aria-hidden />
              Conectar con MetaMask
            </button>
            <p className="ds-rbac-landing__metamask-hint">Necesitas la extensión MetaMask instalada</p>
            <Link href="/market" className="ds-rbac-landing__first-time">
              Mi Primera Vez
            </Link>
            <div className="ds-rbac-landing__card-footer">
              <ShieldCheckIcon style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden />
              <p>
                Tu seguridad es nuestra prioridad. Todas las operaciones son verificadas on-chain.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
