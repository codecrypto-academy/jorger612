"use client";

import {
  BrowserProvider,
  Eip1193Provider,
  JsonRpcSigner,
} from "ethers";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { LOCAL_CHAIN_ID, LOCAL_RPC_URL } from "@/config/contracts";

type Web3ContextValue = {
  address?: `0x${string}`;
  chainId?: number;
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isMetaMaskAvailable: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  switchToLocalNetwork: () => Promise<void>;
};

const Web3Context = createContext<Web3ContextValue | undefined>(undefined);

const LOCAL_CHAIN_HEX = `0x${LOCAL_CHAIN_ID.toString(16)}`;

const LOCAL_CHAIN_PARAMS = {
  chainId: LOCAL_CHAIN_HEX,
  chainName: "Anvil Localhost",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: [LOCAL_RPC_URL],
};

function getEthereum(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
}

async function createBrowserProvider(
  ethereum: Eip1193Provider
): Promise<BrowserProvider> {
  return new BrowserProvider(ethereum, LOCAL_CHAIN_ID);
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const ethereumRef = useRef<Eip1193Provider | undefined>(undefined);
  const [provider, setProvider] = useState<BrowserProvider | undefined>();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();
  const [address, setAddress] = useState<`0x${string}` | undefined>();
  const [chainId, setChainId] = useState<number | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);

  const isMetaMaskAvailable = useMemo(() => {
    const ethereum = getEthereum();
    if (!ethereum) return false;
    const maybeMetaMask = ethereum as Eip1193Provider & {
      isMetaMask?: boolean;
    };
    return maybeMetaMask.isMetaMask !== undefined
      ? Boolean(maybeMetaMask.isMetaMask)
      : true;
  }, []);

  const updateChainIdFromHex = useCallback((hexId: string) => {
    const parsed = parseInt(hexId, 16);
    setChainId(Number.isNaN(parsed) ? undefined : parsed);
  }, []);

  const resetConnection = useCallback(() => {
    setProvider(undefined);
    setSigner(undefined);
    setAddress(undefined);
  }, []);

  const handleAccountsChanged = useCallback(
    async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        resetConnection();
        return;
      }

      const ethereum = ethereumRef.current;
      if (!ethereum) return;

      try {
        const nextProvider = await createBrowserProvider(ethereum);
        const nextSigner = await nextProvider.getSigner();
        const nextAddress = (await nextSigner.getAddress()) as `0x${string}`;
        const network = await nextProvider.getNetwork();

        setProvider(nextProvider);
        setSigner(nextSigner);
        setAddress(nextAddress);
        setChainId(Number(network.chainId));
      } catch (error) {
        console.error("Failed to handle accountsChanged", error);
        resetConnection();
      }
    },
    [resetConnection]
  );

  const handleChainChanged = useCallback(
    (hexId: string) => {
      updateChainIdFromHex(hexId);
    },
    [updateChainIdFromHex]
  );

  useEffect(() => {
    const ethereum = getEthereum();
    ethereumRef.current = ethereum;

    if (!ethereum) {
      return;
    }

    (async () => {
      try {
        const chainHex = await ethereum.request({ method: "eth_chainId" });
        if (typeof chainHex === "string") {
          updateChainIdFromHex(chainHex);
        }
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as string[];
        if (accounts && accounts.length > 0) {
          await handleAccountsChanged(accounts);
        }
      } catch (error) {
        console.error("Failed to initialise Web3 context", error);
      }
    })();

    ethereum.on?.("accountsChanged", handleAccountsChanged);
    ethereum.on?.("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      ethereum.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [handleAccountsChanged, handleChainChanged, updateChainIdFromHex]);

  const connect = useCallback(async () => {
    const ethereum = ethereumRef.current ?? getEthereum();
    if (!ethereum) {
      throw new Error("MetaMask no está disponible en este navegador.");
    }

    try {
      setIsConnecting(true);
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      await handleAccountsChanged(accounts);
    } finally {
      setIsConnecting(false);
    }
  }, [handleAccountsChanged]);

  const switchToLocalNetwork = useCallback(async () => {
    const ethereum = ethereumRef.current ?? getEthereum();
    if (!ethereum) {
      throw new Error("MetaMask no está disponible en este navegador.");
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: LOCAL_CHAIN_HEX }],
      });
    } catch (error) {
      // Error code 4902 indicates the chain is missing.
      const providerError = error as { code?: number };
      if (providerError?.code === 4902) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [LOCAL_CHAIN_PARAMS],
        });
      } else {
        throw error;
      }
    }
  }, []);

  const value = useMemo<Web3ContextValue>(
    () => ({
      address,
      chainId,
      provider,
      signer,
      isConnected: Boolean(address && signer),
      isCorrectNetwork: chainId === LOCAL_CHAIN_ID,
      isMetaMaskAvailable,
      isConnecting,
      connect,
      switchToLocalNetwork,
    }),
    [
      address,
      chainId,
      connect,
      isConnecting,
      isMetaMaskAvailable,
      provider,
      signer,
      switchToLocalNetwork,
    ]
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 debe usarse dentro de Web3Provider");
  }
  return context;
}

