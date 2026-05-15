'use client';

import { CONTRACT_ADDRESS } from '@/lib/contract';
import { CONTRACT_DISPLAY_NAME } from '@/lib/config';
import type { DashboardStats } from '@/hooks/useDashboardData';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return addr || '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface SyncBarProps {
  stats: DashboardStats;
}

export function SyncBar({ stats }: SyncBarProps) {
  const synced = stats.networkSynced;
  const lastSync =
    stats.indexer?.syncedToBlock != null
      ? `bloque índice ${stats.indexer.syncedToBlock.toLocaleString('es')}`
      : stats.lastFetchAt
        ? 'datos cargados desde API'
        : '—';

  return (
    <div className="ds-sync-bar">
      <span className="ds-sync-bar__item">
        <CheckCircleIcon style={{ width: 18, height: 18, color: synced ? '#22c55e' : '#eab308' }} />
        {synced ? 'Sistema sincronizado con blockchain' : 'Indexador en proceso de sincronización'}
      </span>
      <span className="ds-sync-bar__sep">·</span>
      <span className="ds-sync-bar__item">
        Contrato: <strong>{CONTRACT_DISPLAY_NAME}</strong>
        {CONTRACT_ADDRESS ? ` (${shortAddr(CONTRACT_ADDRESS)})` : ''}
      </span>
      <span className="ds-sync-bar__sep">·</span>
      <span className="ds-sync-bar__item">Última lectura: {lastSync}</span>
    </div>
  );
}
