'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Usuario } from '@/types';
import { getSignedContract, parseContractError } from '@/lib/contract';
import { useWallet } from '@/context/WalletContext';
import { apiGet, apiPost } from '@/lib/api';

export function useUsuarios() {
  const { account } = useWallet();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = account ? `?account=${encodeURIComponent(account)}` : '';
      const data = await apiGet(`/rbac/usuarios${query}`);
      setUsuarios((data.items ?? []) as Usuario[]);
    } catch (err) {
      setError(parseContractError(err));
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    if (!account) {
      setUsuarios([]);
      setError(null);
    }
  }, [account]);

  const crearUsuario = useCallback(async (signer: ethers.Signer, login: string, nombre: string, rolId: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.crearUsuario(login, nombre, rolId);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    await fetchUsuarios();
  }, [fetchUsuarios]);

  const modificarUsuario = useCallback(async (signer: ethers.Signer, id: number, login: string, nombre: string, rolId: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.modificarUsuario(id, login, nombre, rolId);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    await fetchUsuarios();
  }, [fetchUsuarios]);

  const inhabilitarUsuario = useCallback(async (signer: ethers.Signer, id: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.inhabilitarUsuario(id);
    await tx.wait();
    await apiPost('/rbac/invalidate');
    await fetchUsuarios();
  }, [fetchUsuarios]);

  return { usuarios, loading, error, fetchUsuarios, crearUsuario, modificarUsuario, inhabilitarUsuario };
}
