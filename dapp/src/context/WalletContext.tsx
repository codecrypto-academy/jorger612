'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { ethers } from 'ethers';
import type { Eip1193Provider } from 'ethers';

type MetaMaskProvider = Eip1193Provider & {
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
};
import { CHAIN_ID, RPC_URL } from '@/lib/contract';
import { getEip1193Provider } from '@/lib/eip1193';

function chainIdToHex(id: number): string {
  return `0x${BigInt(id).toString(16)}`;
}

/**
 * Pide a MetaMask cambiar a la red configurada (p. ej. Besu 1337 = 0x539).
 * Si la red no está añadida, usa wallet_addEthereumChain con el RPC del .env.
 */
async function ensureTargetChain(ethereum: Eip1193Provider) {
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
            chainName: 'Besu VPS',
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

  const ownerCheckSeq = useRef(0);
  const accountRef = useRef<string | null>(null);
  accountRef.current = account;

  const checkOwner = useCallback(async (addr: string, walletProvider?: ethers.BrowserProvider) => {
    const seq = ++ownerCheckSeq.current;
    const { getReadOnlyContract, isConfiguredContractOwner } = await import('@/lib/contract');
    let matchesOnChain = false;
    try {
      const injected = getEip1193Provider();
      const prov =
        walletProvider
        ?? (injected ? new ethers.BrowserProvider(injected) : null);
      const contract = prov ? getReadOnlyContract(prov) : getReadOnlyContract();
      const owner: string = await contract.owner();
      matchesOnChain = owner.toLowerCase() === addr.toLowerCase();
    } catch {
      matchesOnChain = false;
    }
    if (seq !== ownerCheckSeq.current) return;
    setIsOwner(matchesOnChain || isConfiguredContractOwner(addr));
  }, []);

  const bindWallet = useCallback(
    async (eth: Eip1193Provider, accounts: string[]) => {
      if (!accounts.length) return;
      const selected = accounts[0];
      await ensureTargetChain(eth);
      const prov = new ethers.BrowserProvider(eth);
      const network = await prov.getNetwork();
      const sig = await prov.getSigner();
      setProvider(prov);
      setSigner(sig);
      setAccount(selected);
      setChainId(Number(network.chainId));
      await checkOwner(selected, prov);
    },
    [checkOwner],
  );

  const switchToTargetChain = useCallback(async () => {
    const eth = getEip1193Provider();
    if (!eth) {
      setError('MetaMask no detectado. Por favor instala la extension.');
      return;
    }
    setError(null);
    try {
      await ensureTargetChain(eth);
      const prov = new ethers.BrowserProvider(eth);
      setProvider(prov);
      setSigner(await prov.getSigner());
      const network = await prov.getNetwork();
      setChainId(Number(network.chainId));
      if (accountRef.current) await checkOwner(accountRef.current, prov);
    } catch (err) {
      const e = err as { code?: number; message?: string };
      if (e?.code === 4001 || e?.message?.includes('rejected') || e?.message?.includes('User denied')) {
        setError('Cambio de red rechazado por el usuario.');
      } else {
        setError(e?.message || (err instanceof Error ? err.message : 'Error al cambiar de red'));
      }
    }
  }, [checkOwner]);

  const connect = useCallback(async () => {
    setError(null);
    const eth = getEip1193Provider();
    if (!eth) {
      setError('MetaMask no detectado. Por favor instala la extension.');
      return;
    }
    try {
      const prov = new ethers.BrowserProvider(eth);
      const accounts: string[] = await prov.send('eth_requestAccounts', []);
      if (!accounts.length) throw new Error('No hay cuentas disponibles.');
      await bindWallet(eth, accounts);
    } catch (err) {
      const e = err as { code?: number; message?: string };
      if (e?.code === 4001 || e?.message?.includes('rejected') || e?.message?.includes('User denied')) {
        setError('Conexion rechazada por el usuario.');
      } else {
        setError(e?.message || (err instanceof Error ? err.message : 'Error al conectar wallet'));
      }
    }
  }, [bindWallet]);

  const disconnect = useCallback(() => {
    ownerCheckSeq.current += 1;
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setIsOwner(false);
    setError(null);
  }, []);

  useEffect(() => {
    const eth = getEip1193Provider() as MetaMaskProvider | null;
    if (!eth) return;

    /**
     * Si cambia la cuenta activa en MetaMask, re-vincula la sesión (los hooks recargan datos por `account`).
     * No actuar cuando el evento repite la misma cuenta (p. ej. justo tras conectar).
     */
    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      if (!accounts?.length) {
        disconnect();
        return;
      }
      const next = accounts[0];
      const prev = accountRef.current;
      if (prev && prev.toLowerCase() !== next.toLowerCase()) {
        void bindWallet(eth, accounts);
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    /** Restaurar sesión si MetaMask ya tenía la pestaña autorizada (sin popup). */
    void (async () => {
      try {
        const accounts = (await eth.request({ method: 'eth_accounts' })) as string[];
        if (accounts?.length) await bindWallet(eth, accounts);
      } catch {
        /* ignorar */
      }
    })();

    /** Respaldo: al volver a la pestaña, si la cuenta activa cambió sin evento, cerrar sesión. */
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const prev = accountRef.current;
      if (!prev) return;
      void (async () => {
        try {
          const nextEth = getEip1193Provider();
          if (!nextEth) return;
          const accts = (await nextEth.request({ method: 'eth_accounts' })) as string[];
          const next = accts[0];
          if (next && prev.toLowerCase() !== next.toLowerCase()) {
            void bindWallet(nextEth, [next]);
          }
        } catch {
          /* ignorar */
        }
      })();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', handleChainChanged);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [bindWallet, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        account,
        chainId,
        isConnected: !!account,
        isOwner,
        provider,
        signer,
        connect,
        disconnect,
        switchToTargetChain,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
