'use client';

import type { DashboardStats } from '@/hooks/useDashboardData';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  LinkIcon,
  Squares2X2Icon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface KpiCardsProps {
  stats: DashboardStats;
  loading: boolean;
}

function formatBlockAgo(sec: number | null): string {
  if (sec == null) return '—';
  if (sec < 60) return `hace ${sec} s`;
  if (sec < 3600) return `hace ${Math.floor(sec / 60)} min`;
  return `hace ${Math.floor(sec / 3600)} h`;
}

export function KpiCards({ stats, loading }: KpiCardsProps) {
  const cards = [
    {
      label: 'Roles activos',
      value: loading ? '—' : String(stats.rolesActivos),
      sub: loading ? '' : stats.rolesInactivos > 0 ? `${stats.rolesInactivos} inactivos` : 'Sin inactivos',
      Icon: ShieldCheckIcon,
      tone: 'purple' as const,
    },
    {
      label: 'Usuarios',
      value: loading ? '—' : String(stats.usuariosTotal),
      sub: 'Registrados on-chain',
      Icon: UserGroupIcon,
      tone: 'blue' as const,
    },
    {
      label: 'Vínculos menú–rol',
      value: loading ? '—' : String(stats.vinculosMenuRol),
      sub: 'Asociaciones en el contrato',
      Icon: LinkIcon,
      tone: 'teal' as const,
    },
    {
      label: 'Menús activos',
      value: loading ? '—' : String(stats.menusActivos),
      sub: loading ? '' : `${stats.menusTotal} en total`,
      Icon: Squares2X2Icon,
      tone: 'green' as const,
    },
    {
      label: 'Último bloque',
      value: loading ? '—' : stats.lastBlock != null ? stats.lastBlock.toLocaleString('es') : '—',
      sub: formatBlockAgo(stats.lastBlockAgoSec),
      Icon: CubeIcon,
      tone: 'slate' as const,
    },
  ];

  return (
    <div className="ds-kpi-grid">
      {cards.map(({ label, value, sub, Icon, tone }) => (
        <div key={label} className={`ds-kpi-card ds-kpi-card--${tone}`}>
          <div className="ds-kpi-card__icon">
            <Icon style={{ width: 22, height: 22 }} />
          </div>
          <div className="ds-kpi-card__body">
            <p className="ds-kpi-card__label">{label}</p>
            <p className="ds-kpi-card__value">{value}</p>
            {sub ? <p className="ds-kpi-card__sub">{sub}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
