'use client';

import type { ActividadItem } from '@/hooks/useDashboardData';
import { ClockIcon } from '@heroicons/react/24/outline';

function shortAddr(addr: string) {
  if (!addr || addr.length < 10) return addr || '—';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  if (!ts) return '';
  const sec = Math.floor(Date.now() / 1000 - ts);
  if (sec < 60) return `hace ${sec}s`;
  if (sec < 3600) return `hace ${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `hace ${Math.floor(sec / 3600)}h`;
  return `hace ${Math.floor(sec / 86400)}d`;
}

function entityLabel(item: ActividadItem): string {
  const t = item.entityType === 'usuario' ? 'Usuario' : item.entityType === 'menu' ? 'Menú' : 'Rol';
  return `${t} #${item.entityId}`;
}

interface RecentActivityProps {
  items: ActividadItem[];
  loading: boolean;
}

export function RecentActivity({ items, loading }: RecentActivityProps) {
  return (
    <section className="ds-panel ds-panel--compact">
      <h2 className="ds-panel__title">Actividad reciente</h2>
      {loading ? (
        <div style={{ marginTop: 12 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="ds-skeleton" style={{ marginBottom: 10, height: 48 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="ds-muted" style={{ margin: '16px 0 0', fontSize: 13 }}>
          Sin eventos indexados aún. El indexador rellenará esta lista tras sincronizar.
        </p>
      ) : (
        <ul className="ds-activity-list">
          {items.map((item, idx) => (
            <li key={`${item.blockNumber}-${item.timestamp}-${idx}`} className="ds-activity-item">
              <span className="ds-activity-item__icon">
                <ClockIcon style={{ width: 16, height: 16 }} />
              </span>
              <div className="ds-activity-item__body">
                <p className="ds-activity-item__title">
                  {item.accion}
                  <span className="ds-muted"> · {entityLabel(item)}</span>
                </p>
                {item.detalle ? (
                  <p className="ds-activity-item__meta">{item.detalle}</p>
                ) : (
                  <p className="ds-activity-item__meta">{shortAddr(item.ejecutor)}</p>
                )}
              </div>
              <span className="ds-activity-item__time">{timeAgo(item.timestamp)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
