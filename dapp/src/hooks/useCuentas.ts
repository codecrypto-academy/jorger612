'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { CuentaAutorizada } from '@/types';
import { getReadOnlyContract, getSignedContract, parseContractError } from '@/lib/contract';
import { queryFilterSafe } from '@/lib/queryFilterSafe';
import { useWallet } from '@/context/WalletContext';

export function useCuentas() {
  const { account } = useWallet();
  const [cuentas, setCuentas] = useState<CuentaAutorizada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCuentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const contract = getReadOnlyContract();
      const filter = contract.filters.CuentaCreada();
      const events = await queryFilterSafe(contract, filter);
      const addresses = [...new Set(events.map((e) => (e as ethers.EventLog).args[0]))];
      const data: CuentaAutorizada[] = [];
      for (const addr of addresses) {
        const c = await contract.cuentas(addr);
        if (c.wallet && c.wallet !== ethers.ZeroAddress) {
          data.push({
            wallet: c.wallet,
            nombre: c.nombre,
            fechaHora: Number(c.fechaHora),
            activa: c.activa,
          });
        }
      }
      setCuentas(data);
    } catch (err) {
      setError(parseContractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!account) {
      setCuentas([]);
      setError(null);
    }
  }, [account]);

  const crearCuenta = useCallback(async (signer: ethers.Signer, wallet: string, nombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.crearCuenta(wallet, nombre);
    await tx.wait();
    await fetchCuentas();
  }, [fetchCuentas]);

  const actualizarCuenta = useCallback(async (signer: ethers.Signer, wallet: string, nuevoNombre: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.actualizarCuenta(wallet, nuevoNombre);
    await tx.wait();
    await fetchCuentas();
  }, [fetchCuentas]);

  const eliminarCuenta = useCallback(async (signer: ethers.Signer, wallet: string) => {
    const contract = getSignedContract(signer);
    const tx = await contract.eliminarCuenta(wallet);
    await tx.wait();
    await fetchCuentas();
  }, [fetchCuentas]);

  return { cuentas, loading, error, fetchCuentas, crearCuenta, actualizarCuenta, eliminarCuenta };
}
