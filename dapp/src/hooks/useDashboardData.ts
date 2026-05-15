'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { apiGet } from '@/lib/api';
import { RPC_URL } from '@/lib/contract';
import { Rol, Usuario, Menu } from '@/types';

export interface ActividadItem {
  entityType: string;
  entityId: number;
  accion: string;
  detalle: string;
  ejecutor: string;
  timestamp: number;
  blockNumber: number;
}

export interface RolDashboardRow extends Rol {
  usuariosCount: number;
  vinculosCount: number;
}

export interface HealthIndexer {
  enabled?: boolean;
  running?: boolean;
  syncedToBlock?: number | null;
  latestBlock?: number;
  lag?: number | null;
  lastError?: string | null;
}

export interface DashboardStats {
  rolesActivos: number;
  rolesInactivos: number;
  usuariosTotal: number;
  vinculosMenuRol: number;
  menusActivos: number;
  menusTotal: number;
  lastBlock: number | null;
  lastBlockAgoSec: number | null;
  networkSynced: boolean;
  indexer: HealthIndexer | null;
  lastFetchAt: number | null;
}

export function useDashboardData(enabled: boolean) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RolDashboardRow[]>([]);
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    rolesActivos: 0,
    rolesInactivos: 0,
    usuariosTotal: 0,
    vinculosMenuRol: 0,
    menusActivos: 0,
    menusTotal: 0,
    lastBlock: null,
    lastBlockAgoSec: null,
    networkSynced: false,
    indexer: null,
    lastFetchAt: null,
  });
  const blockFetchedAt = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, usuariosRes, menusRes, vinculosRes, actividadRes, healthRes] = await Promise.all([
        apiGet('/rbac/roles'),
        apiGet('/rbac/usuarios'),
        apiGet('/rbac/menus'),
        apiGet('/rbac/vinculos'),
        apiGet('/rbac/actividad-reciente?limit=8'),
        apiGet('/health'),
      ]);

      const rolesList = (rolesRes.items ?? []) as Rol[];
      const usuariosList = (usuariosRes.items ?? []) as Usuario[];
      const menusList = (menusRes.items ?? []) as Menu[];
      const vinculosList = (vinculosRes.items ?? []) as { rolId: number; menuIds: number[] }[];

      const usuariosPorRol = new Map<number, number>();
      for (const u of usuariosList) {
        if (u.rolId > 0) {
          usuariosPorRol.set(u.rolId, (usuariosPorRol.get(u.rolId) ?? 0) + 1);
        }
      }
      const vinculosPorRol = new Map<number, number>();
      let vinculosTotal = 0;
      for (const v of vinculosList) {
        const n = v.menuIds?.length ?? 0;
        vinculosPorRol.set(v.rolId, n);
        vinculosTotal += n;
      }

      const rows: RolDashboardRow[] = rolesList.map((r) => ({
        ...r,
        usuariosCount: usuariosPorRol.get(r.id) ?? 0,
        vinculosCount: vinculosPorRol.get(r.id) ?? 0,
      }));
      rows.sort((a, b) => a.id - b.id);
      setRoles(rows);
      setActividad((actividadRes.items ?? []) as ActividadItem[]);

      let lastBlock: number | null = null;
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        lastBlock = await provider.getBlockNumber();
        blockFetchedAt.current = Date.now();
      } catch {
        const idx = healthRes?.indexer as HealthIndexer | undefined;
        if (idx?.latestBlock != null) {
          lastBlock = Number(idx.latestBlock);
          blockFetchedAt.current = Date.now();
        }
      }

      const indexer = (healthRes?.indexer ?? null) as HealthIndexer | null;
      const lag = indexer?.lag != null ? Number(indexer.lag) : null;
      const synced = lag === 0 || (lag != null && lag <= 12);

      setStats({
        rolesActivos: rolesList.filter((r) => r.activo).length,
        rolesInactivos: rolesList.filter((r) => !r.activo).length,
        usuariosTotal: usuariosList.length,
        vinculosMenuRol: vinculosTotal,
        menusActivos: menusList.filter((m) => m.activo).length,
        menusTotal: menusList.length,
        lastBlock,
        lastBlockAgoSec: blockFetchedAt.current ? 0 : null,
        networkSynced: synced,
        indexer,
        lastFetchAt: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el panel');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || stats.lastBlock == null) return;
    const t = setInterval(() => {
      if (blockFetchedAt.current) {
        setStats((s) => ({
          ...s,
          lastBlockAgoSec: Math.floor((Date.now() - blockFetchedAt.current!) / 1000),
        }));
      }
    }, 5000);
    return () => clearInterval(t);
  }, [enabled, stats.lastBlock, stats.lastFetchAt]);

  useEffect(() => {
    if (!enabled) return;
    const poll = setInterval(() => void refresh(), 30000);
    return () => clearInterval(poll);
  }, [enabled, refresh]);

  return { loading, error, roles, actividad, stats, refresh };
}
