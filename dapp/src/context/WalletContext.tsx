'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isOwner: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  chainId: null,
  isConnected: false,
  isOwner: false,
  provider: null,
  signer: null,
  connect: async () => {},
  disconnect: () => {},
  error: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkOwner = useCallback(async (addr: string) => {
    try {
      const { getReadOnlyContract } = await import('@/lib/contract');
      const contract = getReadOnlyContract();
      const owner: string = await contract.owner();
      setIsOwner(owner.toLowerCase() === addr.toLowerCase());
    } catch {
      setIsOwner(false);
    }
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask no detectado. Por favor instala la extension.');
      return;
    }
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      const accounts: string[] = await prov.send('eth_requestAccounts', []);
      if (!accounts.length) throw new Error('No hay cuentas disponibles.');
      const network = await prov.getNetwork();
      const sig = await prov.getSigner();
      setProvider(prov);
      setSigner(sig);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      await checkOwner(accounts[0]);
    } catch (err) {
      const e = err as { code?: number; message?: string };
      if (e?.code === 4001 || e?.message?.includes('rejected') || e?.message?.includes('User denied')) {
        setError('Conexion rechazada por el usuario.');
      } else {
        setError(e?.message || (err instanceof Error ? err.message : 'Error al conectar wallet'));
      }
    }
  }, [checkOwner]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsOwner(false);
    setError(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    const eth = window.ethereum;
    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) disconnect();
      else {
        setAccount(accounts[0]);
        checkOwner(accounts[0]);
        try {
          const prov = new ethers.BrowserProvider(eth);
          const network = await prov.getNetwork();
          setChainId(Number(network.chainId));
        } catch {
          // mantener chainId anterior si falla
        }
      }
    };
    const handleChainChanged = () => window.location.reload();
    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);
    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, checkOwner]);

  return (
    <WalletContext.Provider value={{
      account, chainId, isConnected: !!account,
      isOwner, provider, signer, connect, disconnect, error,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
