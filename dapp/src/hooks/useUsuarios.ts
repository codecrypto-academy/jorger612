'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { Usuario } from '@/types';
import { getReadOnlyContract, getSignedContract, parseContractError } from '@/lib/contract';
import { useWallet } from '@/context/WalletContext';
import { queryFilterSafe } from '@/lib/queryFilterSafe';

export function useUsuarios() {
  const { account } = useWallet();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = getReadOnlyContract();
      const filter = contract.filters.UsuarioCreado();
      const events = await queryFilterSafe(contract, filter);
      const ids = [...new Set(events.map((e) => Number(((e as ethers.EventLog).args[0]))))];
      const data = await Promise.all(ids.map(async (id) => {
        const u = await contract.usuarios(id);
        return { id: Number(u.id), login: u.login, nombre: u.nombre, rolId: Number(u.rolId), activo: u.activo, timestamp: Number(u.timestamp), ejecutor: u.ejecutor } as Usuario;
      }));
      let filtered = data.filter(u => u.id > 0);
      if (account) {
        const addr = account.toLowerCase();
        filtered = filtered.filter(u => u.ejecutor?.toLowerCase() === addr);
      }
      setUsuarios(filtered);
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
    await fetchUsuarios();
  }, [fetchUsuarios]);

  const modificarUsuario = useCallback(async (signer: ethers.Signer, id: number, login: string, nombre: string, rolId: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.modificarUsuario(id, login, nombre, rolId);
    await tx.wait();
    await fetchUsuarios();
  }, [fetchUsuarios]);

  const inhabilitarUsuario = useCallback(async (signer: ethers.Signer, id: number) => {
    const contract = getSignedContract(signer);
    const tx = await contract.inhabilitarUsuario(id);
    await tx.wait();
    await fetchUsuarios();
  }, [fetchUsuarios]);

  return { usuarios, loading, error, fetchUsuarios, crearUsuario, modificarUsuario, inhabilitarUsuario };
}
