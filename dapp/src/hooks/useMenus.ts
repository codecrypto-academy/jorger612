'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Menu } from '@/types';
import { getReadOnlyContract, getSignedContract, parseContractError } from '@/lib/contract';
import { useWallet } from '@/context/WalletContext';
import { apiGet, apiPost, rbacAccountQuery } from '@/lib/api';

export function useMenus() {
  const { account } = useWallet();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessMapCacheRef = useRef<Map<number, Map<number, boolean>>>(new Map());

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet(`/rbac/menus${rbacAccountQuery(account)}`);
      setMenus((data.items ?? []) as Menu[]);
    } catch (err) {
      setError(parseContractError(err));
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (!account) {
      setMenus([]);
      setError(null);
      accessMapCacheRef.current.clear();
      return;
    }
    void fetchMenus();
  }, [account, fetchMenus]);

  const crearMenu = useCallback(async (signer: ethers.Signer, nombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.crearMenu(nombre);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    await fetchMenus();
  }, [fetchMenus]);

  const modificarMenu = useCallback(async (signer: ethers.Signer, id: number, nombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.modificarMenu(id, nombre);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    await fetchMenus();
  }, [fetchMenus]);

  const inhabilitarMenu = useCallback(async (signer: ethers.Signer, id: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.inhabilitarMenu(id);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    await fetchMenus();
  }, [fetchMenus]);

  const vincularMenuARol = useCallback(async (signer: ethers.Signer, rolId: number, menuId: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.vincularMenuARol(rolId, menuId);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    accessMapCacheRef.current.delete(menuId);
  }, []);

  const desvincularMenuDeRol = useCallback(async (signer: ethers.Signer, rolId: number, menuId: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.desvincularMenuDeRol(rolId, menuId);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    accessMapCacheRef.current.delete(menuId);
  }, []);

  const obtenerMenusPorRol = useCallback(async (rolId: number): Promise<number[]> => {
    try {
      const data = await apiGet(`/rbac/vinculos?rolId=${rolId}`);
      const row = (data.items ?? [])[0];
      if (!row) return [];
      return (row.menuIds ?? []).map((id: number) => Number(id));
    } catch {
      const contract = getReadOnlyContract();
      const ids = await contract.obtenerMenusPorRol(rolId);
      return ids.map(Number);
    }
  }, []);

  const verificarAcceso = useCallback(async (rolId: number, menuId: number): Promise<boolean> => {
    try {
      const menuCache = accessMapCacheRef.current.get(menuId);
      if (menuCache && menuCache.has(rolId)) {
        return Boolean(menuCache.get(rolId));
      }
      const data = await apiGet(`/rbac/menu-access/${menuId}`);
      const nextCache = new Map<number, boolean>();
      for (const row of (data.items ?? []) as Array<{ rolId: number; allowed: boolean }>) {
        nextCache.set(Number(row.rolId), Boolean(row.allowed));
      }
      accessMapCacheRef.current.set(menuId, nextCache);
      return Boolean(nextCache.get(rolId));
    } catch {
      const contract = getReadOnlyContract();
      return contract.verificarAcceso(rolId, menuId);
    }
  }, []);

  return { menus, loading, error, fetchMenus, crearMenu, modificarMenu, inhabilitarMenu, vincularMenuARol, desvincularMenuDeRol, obtenerMenusPorRol, verificarAcceso };
}
