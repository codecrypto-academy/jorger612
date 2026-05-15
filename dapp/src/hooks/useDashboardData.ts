'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiGet, rbacAccountQuery } from '@/lib/api';
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

const INITIAL_STATS: DashboardStats = {
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
};

function sameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function useDashboardData(account: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorLevel, setErrorLevel] = useState<'error' | 'warning' | null>(null);
  const [roles, setRoles] = useState<RolDashboardRow[]>([]);
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>(INITIAL_STATS);
  const blockFetchedAt = useRef<number | null>(null);

  const clearData = useCallback(() => {
    setRoles([]);
    setActividad([]);
    setStats(INITIAL_STATS);
    setError(null);
    setErrorLevel(null);
    blockFetchedAt.current = null;
  }, []);

  const refresh = useCallback(async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    setErrorLevel(null);
    const q = rbacAccountQuery(account);
    try {
      const [rolesSettled, usuariosSettled, menusSettled, vinculosSettled, actividadSettled, healthSettled] =
        await Promise.allSettled([
          apiGet(`/rbac/roles${q}`),
          apiGet(`/rbac/usuarios${q}`),
          apiGet(`/rbac/menus${q}`),
          apiGet('/rbac/vinculos'),
          apiGet('/rbac/actividad-reciente?limit=8'),
          apiGet('/health'),
        ]);

      const coreErrors: string[] = [];
      const unwrap = <T,>(result: PromiseSettledResult<T>, label: string): T | null => {
        if (result.status === 'fulfilled') return result.value;
        coreErrors.push(`${label}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
        return null;
      };

      const rolesRes = unwrap(rolesSettled, 'roles');
      const usuariosRes = unwrap(usuariosSettled, 'usuarios');
      const menusRes = unwrap(menusSettled, 'menus');
      const vinculosRes = unwrap(vinculosSettled, 'vinculos');
      const actividadRes = actividadSettled.status === 'fulfilled' ? actividadSettled.value : null;
      const healthRes = healthSettled.status === 'fulfilled' ? healthSettled.value : null;

      if (!rolesRes || !usuariosRes || !menusRes || !vinculosRes) {
        setError(coreErrors.join(' · ') || 'No se pudieron cargar los datos RBAC desde la API');
        setErrorLevel('error');
        return;
      }

      const rolesList = (rolesRes.items ?? []) as Rol[];
      const usuariosList = (usuariosRes.items ?? []) as Usuario[];
      const menusList = (menusRes.items ?? []) as Menu[];
      const vinculosAll = (vinculosRes.items ?? []) as { rolId: number; menuIds: number[] }[];
      const rolIds = new Set(rolesList.map((r) => r.id));
      const vinculosList = vinculosAll.filter((v) => rolIds.has(v.rolId));

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

      const actividadRaw = (actividadRes?.items ?? []) as ActividadItem[];
      setActividad(actividadRaw.filter((ev) => sameAddress(ev.ejecutor, account)));

      if (actividadSettled.status === 'rejected') {
        const msg =
          actividadSettled.reason instanceof Error ? actividadSettled.reason.message : 'actividad-reciente';
        setError(
          `Actividad reciente no disponible (${msg}). Reconstruye el contenedor api en el servidor.`,
        );
        setErrorLevel('warning');
      } else {
        setError(null);
        setErrorLevel(null);
      }

      const indexer = (healthRes?.indexer ?? null) as HealthIndexer | null;
      const lag = indexer?.lag != null ? Number(indexer.lag) : null;
      const synced = lag === 0 || (lag != null && lag <= 12);
      const lastBlock =
        indexer?.latestBlock != null && Number.isFinite(Number(indexer.latestBlock))
          ? Number(indexer.latestBlock)
          : null;
      if (lastBlock != null) {
        blockFetchedAt.current = Date.now();
      }

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
      setErrorLevel('error');
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (!account) {
      clearData();
      return;
    }
    clearData();
    void refresh();
  }, [account, clearData, refresh]);

  useEffect(() => {
    if (!account || stats.lastBlock == null) return;
    const t = setInterval(() => {
      if (blockFetchedAt.current) {
        setStats((s) => ({
          ...s,
          lastBlockAgoSec: Math.floor((Date.now() - blockFetchedAt.current!) / 1000),
        }));
      }
    }, 5000);
    return () => clearInterval(t);
  }, [account, stats.lastBlock, stats.lastFetchAt]);

  useEffect(() => {
    if (!account) return;
    const poll = setInterval(() => void refresh(), 30000);
    return () => clearInterval(poll);
  }, [account, refresh]);

  return { loading, error, errorLevel, roles, actividad, stats, refresh };
}
