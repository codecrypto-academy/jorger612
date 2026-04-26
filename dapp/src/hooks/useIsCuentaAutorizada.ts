'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet } from '@/lib/api';

/**
 * Verifica si la cuenta conectada está registrada en CuentaAutorizada y activa.
 * Usa la API (no RPC directo) para funcionar independientemente de si el puerto
 * del nodo Besu es accesible desde el browser.
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
      const data = await apiGet('/rbac/cuentas');
      const items: { wallet: string; activa: boolean }[] = data?.items ?? [];
      const found = items.find(
        (c) => c.wallet?.toLowerCase() === account.toLowerCase()
      );
      setIsAuthorized(!!found && found.activa === true);
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
