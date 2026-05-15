'use client';

import { CONTRACT_ADDRESS, CHAIN_ID } from '@/lib/contract';
import { NETWORK_NAME, CONTRACT_DISPLAY_NAME } from '@/lib/config';
import type { DashboardStats } from '@/hooks/useDashboardData';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

function shortAddr(addr: string) {
  if (!addr || addr.length < 12) return '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignorar
  }
}

interface BlockchainStatusProps {
  stats: DashboardStats;
}

export function BlockchainStatus({ stats }: BlockchainStatusProps) {
  const synced = stats.networkSynced;
  const lag = stats.indexer?.lag != null ? Number(stats.indexer.lag) : null;
  const confirmations =
    lag === 0 ? 'al día' : lag != null ? `retraso ~${lag} bloques` : '—';

  return (
    <section className="ds-panel ds-panel--compact">
      <h2 className="ds-panel__title">Estado de blockchain</h2>
      <dl className="ds-blockchain-dl">
        <div>
          <dt>Red</dt>
          <dd>
            <span className="ds-inline-dot ds-inline-dot--ok" />
            {NETWORK_NAME} <span className="ds-muted">(chainId {CHAIN_ID})</span>
          </dd>
        </div>
        <div>
          <dt>Contrato inteligente</dt>
          <dd>{CONTRACT_DISPLAY_NAME}</dd>
        </div>
        <div>
          <dt>Dirección del contrato</dt>
          <dd className="ds-mono-row">
            {shortAddr(CONTRACT_ADDRESS)}
            {CONTRACT_ADDRESS ? (
              <button
                type="button"
                className="ds-icon-btn"
                aria-label="Copiar dirección"
                onClick={() => void copyText(CONTRACT_ADDRESS)}
              >
                <DocumentDuplicateIcon style={{ width: 16, height: 16 }} />
              </button>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Último bloque</dt>
          <dd>{stats.lastBlock != null ? stats.lastBlock.toLocaleString('es') : '—'}</dd>
        </div>
        <div>
          <dt>Indexador</dt>
          <dd>{confirmations}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <span className={`ds-status-pill${synced ? ' ds-status-pill--ok' : ' ds-status-pill--warn'}`}>
              {synced ? 'Sincronizado' : 'Sincronizando'}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
