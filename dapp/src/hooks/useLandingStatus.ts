'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { NETWORK_NAME } from '@/lib/config';

interface HealthIndexer {
  enabled?: boolean;
  running?: boolean;
  syncedToBlock?: number | null;
  latestBlock?: number;
  lag?: number | null;
  lastError?: string | null;
}

interface HealthResponse {
  status?: string;
  indexer?: HealthIndexer;
}

export interface LandingStatus {
  networkName: string;
  lastBlock: number | null;
  lastFetchAt: number | null;
  agoLabel: string;
  operational: boolean;
  loading: boolean;
  error: string | null;
}

function formatAgo(sec: number): string {
  if (sec < 60) return `Hace ${sec} s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  return `Hace ${h} h`;
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'No se pudo contactar la API. Comprueba que el servicio esté en marcha.';
  }
  return msg || 'No se pudo leer el estado del sistema';
}

export function useLandingStatus(enabled: boolean) {
  const [status, setStatus] = useState<LandingStatus>({
    networkName: NETWORK_NAME,
    lastBlock: null,
    lastFetchAt: null,
    agoLabel: '—',
    operational: false,
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setStatus((s) => ({ ...s, loading: true, error: null }));
    try {
      const health = (await apiGet('/health')) as HealthResponse;
      const indexer = health.indexer;
      const block =
        indexer?.latestBlock != null && Number.isFinite(Number(indexer.latestBlock))
          ? Number(indexer.latestBlock)
          : null;
      const now = Date.now();
      const operational = health.status === 'ok' && block != null;
      const indexerError = indexer?.lastError?.trim() || null;

      setStatus({
        networkName: NETWORK_NAME,
        lastBlock: block,
        lastFetchAt: operational ? now : null,
        agoLabel: operational ? 'Hace 0 s' : '—',
        operational,
        loading: false,
        error: operational ? null : indexerError,
      });
    } catch (err) {
      setStatus({
        networkName: NETWORK_NAME,
        lastBlock: null,
        lastFetchAt: null,
        agoLabel: '—',
        operational: false,
        loading: false,
        error: friendlyError(err),
      });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const poll = setInterval(() => void refresh(), 30000);
    return () => clearInterval(poll);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || status.lastFetchAt == null) return;
    const tick = () => {
      const sec = Math.floor((Date.now() - status.lastFetchAt!) / 1000);
      setStatus((s) => ({ ...s, agoLabel: formatAgo(sec) }));
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [enabled, status.lastFetchAt]);

  return { status, refresh };
}
