"use client";

import { useState } from "react";

import { LOCAL_CHAIN_ID } from "@/config/contracts";
import { useWeb3 } from "@/context/Web3Context";

export function ChainMismatchBanner() {
  const { isConnected, isCorrectNetwork, switchToLocalNetwork } = useWeb3();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected || isCorrectNetwork) {
    return null;
  }

  const handleSwitch = async () => {
    setError(null);
    setIsSwitching(true);
    try {
      await switchToLocalNetwork();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar de red en MetaMask."
      );
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="alert-card">
      <div>
        <p className="pill">Desalineación de red</p>
        <h2 className="text-xl font-semibold">
          Cambia a la red local de Anvil
        </h2>
        <p className="text-sm text-red-100/80 mt-1">
          Debes operar en la red con chainId {LOCAL_CHAIN_ID} para garantizar la
          coherencia con el contrato Escrow desplegado localmente.
        </p>
        {error && <p className="mt-2 text-sm text-red-200/90">{error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSwitch}
          className="button-primary"
          disabled={isSwitching}
        >
          {isSwitching ? "Cambiando..." : "Cambiar a Anvil"}
        </button>
      </div>
    </div>
  );
}


