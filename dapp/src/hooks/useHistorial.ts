'use client';

import { useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';
import { parseContractError } from '@/lib/contract';

export interface HistorialItem {
  accion: string;
  detalle?: string;
  ejecutor: string;
  timestamp: number;
  blockNumber: number;
}

function enrichMenuHistorialItems(items: HistorialItem[], rolesMap?: Map<number, string>): HistorialItem[] {
  if (!rolesMap?.size) return items;
  return items.map((it) => {
    const v = /^Vinculado a Rol #(\d+)$/.exec(it.accion);
    if (v) {
      const rid = Number(v[1]);
      const nombre = rolesMap.get(rid);
      if (nombre) return { ...it, accion: `Vinculado a ${nombre}` };
    }
    const d = /^Desvinculado de Rol #(\d+)$/.exec(it.accion);
    if (d) {
      const rid = Number(d[1]);
      const nombre = rolesMap.get(rid);
      if (nombre) return { ...it, accion: `Desvinculado de ${nombre}` };
    }
    return it;
  });
}

/** Historial RBAC vía API (misma estrategia que roles/usuarios/menús). */
export function useHistorial() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorialRol = useCallback(async (rolId: number): Promise<HistorialItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/rbac/historial/rol/${rolId}`);
      return (data.items ?? []) as HistorialItem[];
    } catch (err) {
      setError(parseContractError(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistorialUsuario = useCallback(async (usuarioId: number): Promise<HistorialItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/rbac/historial/usuario/${usuarioId}`);
      return (data.items ?? []) as HistorialItem[];
    } catch (err) {
      setError(parseContractError(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistorialMenu = useCallback(
    async (menuId: number, rolesMap?: Map<number, string>): Promise<HistorialItem[]> => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet(`/rbac/historial/menu/${menuId}`);
        const items = (data.items ?? []) as HistorialItem[];
        return enrichMenuHistorialItems(items, rolesMap);
      } catch (err) {
        setError(parseContractError(err));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { fetchHistorialRol, fetchHistorialUsuario, fetchHistorialMenu, loading, error };
}
