'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Menu } from '@/types';
import { getReadOnlyContract, getSignedContract, parseContractError } from '@/lib/contract';
import { useWallet } from '@/context/WalletContext';
import { queryFilterSafe } from '@/lib/queryFilterSafe';

export function useMenus() {
  const { account } = useWallet();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = getReadOnlyContract();
      const filter = contract.filters.MenuCreado();
      const events = await queryFilterSafe(contract, filter);
      const ids = [...new Set(events.map((e) => Number(((e as ethers.EventLog).args[0]))))];
      const data = await Promise.all(ids.map(async (id) => {
        const m = await contract.menus(id);
        return { id: Number(m.id), nombre: m.nombre, activo: m.activo, timestamp: Number(m.timestamp), ejecutor: m.ejecutor } as Menu;
      }));
      let filtered = data.filter(m => m.id > 0);
      if (account) {
        const addr = account.toLowerCase();
        filtered = filtered.filter(m => m.ejecutor?.toLowerCase() === addr);
      }
      setMenus(filtered);
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
    }
  }, [account]);

  const crearMenu = useCallback(async (signer: ethers.Signer, nombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.crearMenu(nombre);
    await tx.wait();
    await fetchMenus();
  }, [fetchMenus]);

  const modificarMenu = useCallback(async (signer: ethers.Signer, id: number, nombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.modificarMenu(id, nombre);
    await tx.wait();
    await fetchMenus();
  }, [fetchMenus]);

  const inhabilitarMenu = useCallback(async (signer: ethers.Signer, id: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.inhabilitarMenu(id);
    await tx.wait();
    await fetchMenus();
  }, [fetchMenus]);

  const vincularMenuARol = useCallback(async (signer: ethers.Signer, rolId: number, menuId: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.vincularMenuARol(rolId, menuId);
    await tx.wait();
  }, []);

  const desvincularMenuDeRol = useCallback(async (signer: ethers.Signer, rolId: number, menuId: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.desvincularMenuDeRol(rolId, menuId);
    await tx.wait();
  }, []);

  const obtenerMenusPorRol = useCallback(async (rolId: number): Promise<number[]> => {
    const contract = getReadOnlyContract();
    const ids = await contract.obtenerMenusPorRol(rolId);
    return ids.map(Number);
  }, []);

  const verificarAcceso = useCallback(async (rolId: number, menuId: number): Promise<boolean> => {
    const contract = getReadOnlyContract();
    return contract.verificarAcceso(rolId, menuId);
  }, []);

  return { menus, loading, error, fetchMenus, crearMenu, modificarMenu, inhabilitarMenu, vincularMenuARol, desvincularMenuDeRol, obtenerMenusPorRol, verificarAcceso };
}
