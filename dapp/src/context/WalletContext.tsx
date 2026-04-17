'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID, RPC_URL } from '@/lib/contract';

function chainIdToHex(id: number): string {
  return `0x${BigInt(id).toString(16)}`;
}

/**
 * Pide a MetaMask cambiar a la red configurada (p. ej. Anvil 31337 = 0x7a69).
 * Si la red no está añadida, usa wallet_addEthereumChain con el RPC del .env.
 */
async function ensureTargetChain(ethereum: NonNullable<typeof window.ethereum>) {
  const targetHex = chainIdToHex(CHAIN_ID);
  const currentHex = (await ethereum.request({ method: 'eth_chainId' })) as string;
  const currentId = Number(BigInt(currentHex));
  if (currentId === CHAIN_ID) return;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetHex }],
    });
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: targetHex,
            chainName: 'Anvil local',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: [RPC_URL],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

interface WalletContextType {
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isOwner: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Fuerza wallet_switchEthereumChain hacia CHAIN_ID (y add chain si hace falta). */
  switchToTargetChain: () => Promise<void>;
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
  switchToTargetChain: async () => {},
  error: null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkOwner = useCallback(async (addr: string, walletProvider?: ethers.BrowserProvider) => {
    const { getReadOnlyContract, isConfiguredContractOwner } = await import('@/lib/contract');
    let matchesOnChain = false;
    try {
      const prov =
        walletProvider
        ?? (typeof window !== 'undefined' && window.ethereum
          ? new ethers.BrowserProvider(window.ethereum)
          : null);
      const contract = prov ? getReadOnlyContract(prov) : getReadOnlyContract();
      const owner: string = await contract.owner();
      matchesOnChain = owner.toLowerCase() === addr.toLowerCase();
    } catch {
      matchesOnChain = false;
    }
    setIsOwner(matchesOnChain || isConfiguredContractOwner(addr));
  }, []);

  const switchToTargetChain = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask no detectado. Por favor instala la extension.');
      return;
    }
    setError(null);
    try {
      await ensureTargetChain(window.ethereum);
      const prov = new ethers.BrowserProvider(window.ethereum);
      setProvider(prov);
      setSigner(await prov.getSigner());
      const network = await prov.getNetwork();
      setChainId(Number(network.chainId));
      if (account) await checkOwner(account, prov);
    } catch (err) {
      const e = err as { code?: number; message?: string };
      if (e?.code === 4001 || e?.message?.includes('rejected') || e?.message?.includes('User denied')) {
        setError('Cambio de red rechazado por el usuario.');
      } else {
        setError(e?.message || (err instanceof Error ? err.message : 'Error al cambiar de red'));
      }
    }
  }, [account, checkOwner]);

  const connect = useCallback(async () => {
    setError(null);
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('MetaMask no detectado. Por favor instala la extension.');
      return;
    }
    try {
      const eth = window.ethereum;
      const prov = new ethers.BrowserProvider(eth);
      const accounts: string[] = await prov.send('eth_requestAccounts', []);
      if (!accounts.length) throw new Error('No hay cuentas disponibles.');

      await ensureTargetChain(eth);

      const provAfterChain = new ethers.BrowserProvider(eth);
      const network = await provAfterChain.getNetwork();
      const sig = await provAfterChain.getSigner();
      setProvider(provAfterChain);
      setSigner(sig);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      await checkOwner(accounts[0], provAfterChain);
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
        try {
          const prov = new ethers.BrowserProvider(eth);
          await checkOwner(accounts[0], prov);
          const network = await prov.getNetwork();
          setChainId(Number(network.chainId));
        } catch {
          await checkOwner(accounts[0]);
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
      isOwner, provider, signer, connect, disconnect, switchToTargetChain, error,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
