'use client';

import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { NETWORK_NAME } from '@/lib/config';
import { RPC_URL } from '@/lib/contract';

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
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const block = await provider.getBlockNumber();
      const now = Date.now();
      setStatus({
        networkName: NETWORK_NAME,
        lastBlock: block,
        lastFetchAt: now,
        agoLabel: 'Hace 0 s',
        operational: true,
        loading: false,
        error: null,
      });
    } catch (err) {
      setStatus((s) => ({
        ...s,
        operational: false,
        loading: false,
        error: err instanceof Error ? err.message : 'No se pudo leer la red',
      }));
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
