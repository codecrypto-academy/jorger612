'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '@/lib/contract';

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
        const contract = getContract();
        const [creados, modificados, inhabilitados] = await Promise.all([
          contract.queryFilter(contract.filters.RolCreado(rolId), 0, 'latest'),
          contract.queryFilter(contract.filters.RolModificado(rolId), 0, 'latest'),
          contract.queryFilter(contract.filters.RolInhabilitado(rolId), 0, 'latest'),
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
        const contract = getContract();
        const [creados, modificados, inhabilitados] = await Promise.all([
          contract.queryFilter(contract.filters.UsuarioCreado(usuarioId), 0, 'latest'),
          contract.queryFilter(contract.filters.UsuarioModificado(usuarioId), 0, 'latest'),
          contract.queryFilter(contract.filters.UsuarioInhabilitado(usuarioId), 0, 'latest'),
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
        const contract = getContract();
        const [creados, modificados, inhabilitados, vinculados, desvinculados] = await Promise.all([
          contract.queryFilter(contract.filters.MenuCreado(menuId), 0, 'latest'),
          contract.queryFilter(contract.filters.MenuModificado(menuId), 0, 'latest'),
          contract.queryFilter(contract.filters.MenuInhabilitado(menuId), 0, 'latest'),
          contract.queryFilter(contract.filters.MenuVinculadoARol(null, menuId), 0, 'latest'),
          contract.queryFilter(contract.filters.MenuDesvinculadoDeRol(null, menuId), 0, 'latest'),
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
