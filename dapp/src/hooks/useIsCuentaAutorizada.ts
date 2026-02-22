'use client';

import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getReadOnlyContract } from '@/lib/contract';

/**
 * Verifica si la cuenta conectada está registrada en CuentaAutorizada y activa.
 * Solo las cuentas autorizadas pueden gestionar roles, usuarios y menús.
 */
export function useIsCuentaAutorizada(account: string | null) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    if (!account) {
      setIsAuthorized(false);
      return;
    }
    setLoading(true);
    try {
      const contract = getReadOnlyContract();
      const c = await contract.cuentas(account);
      const authorized =
        c.wallet && c.wallet !== ethers.ZeroAddress && c.activa === true;
      setIsAuthorized(!!authorized);
    } catch {
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    check();
  }, [check]);

  return { isAuthorized, loading, refetch: check };
}
