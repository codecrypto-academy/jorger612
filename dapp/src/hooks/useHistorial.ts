'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '@/lib/contract';
import { queryFilterSafe } from '@/lib/queryFilterSafe';
import { apiGet } from '@/lib/api';

export interface HistorialItem {
  accion: string;
  detalle?: string;
  ejecutor: string;
  timestamp: number;
  blockNumber: number;
}

function getArgs(ev: ethers.EventLog): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  try {
    const fragment = ev.fragment;
    if (fragment?.inputs) {
      fragment.inputs.forEach((inp, i) => {
        args[inp.name] = ev.args[i];
      });
    }
  } catch {
    if (ev.args && typeof ev.args === 'object' && !Array.isArray(ev.args)) {
      Object.assign(args, ev.args);
    }
  }
  return args;
}

function formatAccion(
  eventName: string,
  args: Record<string, unknown>,
  rolesMap?: Map<number, string>
): string {
  switch (eventName) {
    case 'RolCreado':
      return 'Rol creado';
    case 'RolModificado':
      return 'Nombre modificado';
    case 'RolInhabilitado':
      return 'Rol inhabilitado';
    case 'UsuarioCreado':
      return 'Usuario creado';
    case 'UsuarioModificado':
      return 'Usuario modificado';
    case 'UsuarioInhabilitado':
      return 'Usuario inhabilitado';
    case 'MenuCreado':
      return 'Menu creado';
    case 'MenuModificado':
      return 'Nombre modificado';
    case 'MenuInhabilitado':
      return 'Menu inhabilitado';
    case 'MenuVinculadoARol': {
      const rolId = Number(args.rolId ?? 0);
      const rolNombre = rolesMap?.get(rolId) ?? `Rol #${rolId}`;
      return `Vinculado a ${rolNombre}`;
    }
    case 'MenuDesvinculadoDeRol': {
      const rolId = Number(args.rolId ?? 0);
      const rolNombre = rolesMap?.get(rolId) ?? `Rol #${rolId}`;
      return `Desvinculado de ${rolNombre}`;
    }
    default:
      return eventName;
  }
}

function formatDetalle(eventName: string, args: Record<string, unknown>): string | undefined {
  switch (eventName) {
    case 'RolCreado':
    case 'MenuCreado':
      return String(args.nombre ?? '');
    case 'RolModificado':
    case 'MenuModificado':
      return `${String(args.nombreAnterior ?? '')} → ${String(args.nombreNuevo ?? '')}`;
    case 'UsuarioCreado':
      return `${String(args.login ?? '')} · ${String(args.nombre ?? '')}`;
    case 'UsuarioModificado':
      return `Rol #${args.rolIdAnterior} → Rol #${args.rolIdNuevo}`;
    default:
      return undefined;
  }
}

function toItem(ev: ethers.EventLog, rolesMap?: Map<number, string>): HistorialItem {
  const args = getArgs(ev);
  const eventName = ev.eventName ?? '';
  return {
    accion: formatAccion(eventName, args, rolesMap),
    detalle: formatDetalle(eventName, args),
    ejecutor: String(args.ejecutor ?? ''),
    timestamp: Number(args.timestamp ?? 0),
    blockNumber: ev.blockNumber,
  };
}

export function useHistorial(provider?: ethers.Provider) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(() => getReadOnlyContract(provider), [provider]);

  const fetchHistorialRol = useCallback(
    async (rolId: number): Promise<HistorialItem[]> => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet(`/rbac/historial/rol/${rolId}`);
        return (data.items ?? []) as HistorialItem[];
      } catch {
        // fallback local RPC if API is unavailable
      }
      try {
        const contract = getContract();
        const [creados, modificados, inhabilitados] = await Promise.all([
          queryFilterSafe(contract, contract.filters.RolCreado(rolId)),
          queryFilterSafe(contract, contract.filters.RolModificado(rolId)),
          queryFilterSafe(contract, contract.filters.RolInhabilitado(rolId)),
        ]);
        const items: HistorialItem[] = [...creados, ...modificados, ...inhabilitados]
          .filter((e): e is ethers.EventLog => 'args' in e && 'eventName' in e)
          .map((ev) => toItem(ev));
        items.sort(
          (a, b) =>
            (a.blockNumber !== b.blockNumber ? a.blockNumber - b.blockNumber : a.timestamp - b.timestamp)
        );
        return items;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar historial');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const fetchHistorialUsuario = useCallback(
    async (usuarioId: number): Promise<HistorialItem[]> => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet(`/rbac/historial/usuario/${usuarioId}`);
        return (data.items ?? []) as HistorialItem[];
      } catch {
        // fallback local RPC if API is unavailable
      }
      try {
        const contract = getContract();
        const [creados, modificados, inhabilitados] = await Promise.all([
          queryFilterSafe(contract, contract.filters.UsuarioCreado(usuarioId)),
          queryFilterSafe(contract, contract.filters.UsuarioModificado(usuarioId)),
          queryFilterSafe(contract, contract.filters.UsuarioInhabilitado(usuarioId)),
        ]);
        const items: HistorialItem[] = [...creados, ...modificados, ...inhabilitados]
          .filter((e): e is ethers.EventLog => 'args' in e && 'eventName' in e)
          .map((ev) => toItem(ev));
        items.sort(
          (a, b) =>
            (a.blockNumber !== b.blockNumber ? a.blockNumber - b.blockNumber : a.timestamp - b.timestamp)
        );
        return items;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar historial');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  const fetchHistorialMenu = useCallback(
    async (menuId: number, rolesMap?: Map<number, string>): Promise<HistorialItem[]> => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet(`/rbac/historial/menu/${menuId}`);
        const items = (data.items ?? []) as HistorialItem[];
        return items.map((item) => {
          if (!item.accion.startsWith('Vinculado a Rol #') && !item.accion.startsWith('Desvinculado de Rol #')) {
            return item;
          }
          const match = item.accion.match(/Rol #(\d+)/);
          if (!match) return item;
          const rolId = Number(match[1]);
          const rolNombre = rolesMap?.get(rolId);
          if (!rolNombre) return item;
          return {
            ...item,
            accion: item.accion.startsWith('Vinculado')
              ? `Vinculado a ${rolNombre}`
              : `Desvinculado de ${rolNombre}`,
          };
        });
      } catch {
        // fallback local RPC if API is unavailable
      }
      try {
        const contract = getContract();
        const [creados, modificados, inhabilitados, vinculados, desvinculados] = await Promise.all([
          queryFilterSafe(contract, contract.filters.MenuCreado(menuId)),
          queryFilterSafe(contract, contract.filters.MenuModificado(menuId)),
          queryFilterSafe(contract, contract.filters.MenuInhabilitado(menuId)),
          queryFilterSafe(contract, contract.filters.MenuVinculadoARol(null, menuId)),
          queryFilterSafe(contract, contract.filters.MenuDesvinculadoDeRol(null, menuId)),
        ]);
        const all = [...creados, ...modificados, ...inhabilitados, ...vinculados, ...desvinculados];
        const items: HistorialItem[] = all
          .filter((e): e is ethers.EventLog => 'args' in e && 'eventName' in e)
          .map((ev) => toItem(ev, rolesMap));
        items.sort(
          (a, b) =>
            (a.blockNumber !== b.blockNumber ? a.blockNumber - b.blockNumber : a.timestamp - b.timestamp)
        );
        return items;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar historial');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getContract]
  );

  return { fetchHistorialRol, fetchHistorialUsuario, fetchHistorialMenu, loading, error };
}
