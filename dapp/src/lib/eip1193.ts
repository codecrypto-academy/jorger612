import type { Eip1193Provider } from 'ethers';

/**
 * Devuelve el proveedor EIP-1193 que debe usarse para MetaMask cuando hay
 * varias wallets inyectadas (ethereum.providers[]).
 */
export function getEip1193Provider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & { ethereum?: unknown };
  const eth = w.ethereum;
  if (!eth) return null;
  const multi = eth as { providers?: Eip1193Provider[]; isMetaMask?: boolean };
  if (Array.isArray(multi.providers) && multi.providers.length > 0) {
    const mm = multi.providers.find((p) => (p as { isMetaMask?: boolean }).isMetaMask);
    return (mm ?? multi.providers[0]) as Eip1193Provider;
  }
  return eth as Eip1193Provider;
}
