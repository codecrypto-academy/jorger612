'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Rol } from '@/types';
import { getReadOnlyContract, getSignedContract, parseContractError } from '@/lib/contract';
import { useWallet } from '@/context/WalletContext';
import { apiGet } from '@/lib/api';

export function useRoles() {
  const { account } = useWallet();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = account ? `?account=${encodeURIComponent(account)}` : '';
      const data = await apiGet(`/rbac/roles${query}`);
      setRoles((data.items ?? []) as Rol[]);
    } catch (err) {
      setError(parseContractError(err));
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (!account) {
      setRoles([]);
      setError(null);
    }
  }, [account]);

  const crearRol = useCallback(async (signer: ethers.Signer, nombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.crearRol(nombre);
    await tx.wait();
    await fetchRoles();
  }, [fetchRoles]);

  const modificarRol = useCallback(async (signer: ethers.Signer, id: number, nombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.modificarRol(id, nombre);
    await tx.wait();
    await fetchRoles();
  }, [fetchRoles]);

  const inhabilitarRol = useCallback(async (signer: ethers.Signer, id: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.inhabilitarRol(id);
    await tx.wait();
    await fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, error, fetchRoles, crearRol, modificarRol, inhabilitarRol };
}
