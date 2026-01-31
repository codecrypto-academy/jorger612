import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { CONFIG } from '../config';
import DialogueHistoryABI from '../../DialogueHistory.json';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [address, setAddress] = useState(null);
  const [ensName, setEnsName] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    if (typeof window?.ethereum === 'undefined') {
      setError('MetaMask no detectado. Instala la extensión.');
      return;
    }
    const ethereum = window.ethereum.providers
      ? window.ethereum.providers.find((p) => p.isMetaMask)
      : (window.ethereum?.isMetaMask ? window.ethereum : null);
    if (!ethereum) {
      setError('MetaMask no encontrado. Si tienes varias wallets, instala o activa MetaMask.');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const prov = new BrowserProvider(ethereum);
      const network = await prov.getNetwork();
      if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONFIG.CHAIN_ID.toString(16)}` }],
          });
        } catch (switchErr) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${CONFIG.CHAIN_ID.toString(16)}`,
              chainName: 'Localhost',
              rpcUrls: [CONFIG.RPC_URL],
            }],
          });
        }
      }
      const accounts = await prov.send('eth_requestAccounts', []);
      if (!accounts?.length) throw new Error('No se obtuvo ninguna cuenta');
      const sig = await prov.getSigner();
      const addr = await sig.getAddress();
      setProvider(prov);
      setSigner(sig);
      setAddress(addr);
      const c = new Contract(CONFIG.CONTRACT_ADDRESS, DialogueHistoryABI, sig);
      setContract(c);
      try {
        const name = await prov.lookupAddress(addr);
        setEnsName(name || null);
      } catch {
        setEnsName(null);
      }
    } catch (err) {
      setError(err?.message || 'Error al conectar');
      setAddress(null);
      setProvider(null);
      setSigner(null);
      setContract(null);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setEnsName(null);
    setProvider(null);
    setSigner(null);
    setContract(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!window?.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (!accounts?.length) disconnect();
    };
    const handleChainChanged = () => window.location.reload();
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  const displayAddress = ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '');

  return (
    <Web3Context.Provider
      value={{
        address,
        ensName,
        displayAddress,
        provider,
        signer,
        contract,
        isConnecting,
        error,
        connect,
        disconnect,
        isConnected: !!address,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider');
  return ctx;
}
