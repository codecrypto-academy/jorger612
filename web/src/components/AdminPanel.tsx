"use client";

import { useState } from "react";
import { Contract, isAddress } from "ethers";
import { useQueryClient } from "@tanstack/react-query";

import { ESCROW_ABI } from "@/abi/escrow";
import { CONTRACT_ADDRESSES, LOCAL_CHAIN_ID } from "@/config/contracts";
import { useWeb3 } from "@/context/Web3Context";
import { extractErrorMessage } from "@/lib/errors";
import type { AllowedToken } from "@/hooks/useEscrow";

export function AdminPanel({
  tokens,
  isOwner,
  ownerAddress,
}: {
  tokens: AllowedToken[];
  isOwner: boolean;
  ownerAddress?: string;
}) {
  const {
    isConnected,
    isConnecting,
    isCorrectNetwork,
    isMetaMaskAvailable,
    signer,
    connect,
    switchToLocalNetwork,
  } = useWeb3();
  const queryClient = useQueryClient();

  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [status, setStatus] =
    useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async () => {
    setErrorMessage(null);
    try {
      await connect();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo conectar con MetaMask."
      );
    }
  };

  const handleSwitchNetwork = async () => {
    setErrorMessage(null);
    try {
      await switchToLocalNetwork();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo cambiar de red."
      );
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isOwner) return;

    if (!isAddress(newTokenAddress)) {
      setStatus("error");
      setErrorMessage("La dirección ingresada no es válida.");
      return;
    }

    if (!signer) {
      setStatus("error");
      setErrorMessage("Conecta MetaMask para añadir tokens permitidos.");
      return;
    }

    if (!isCorrectNetwork) {
      setStatus("error");
      setErrorMessage("Debes cambiar a la red local antes de añadir tokens.");
      return;
    }

    try {
      setStatus("pending");
      setErrorMessage(null);

      const escrowContract = new Contract(
        CONTRACT_ADDRESSES.escrow,
        ESCROW_ABI,
        signer
      );

      const tx = await escrowContract.addToken(
        newTokenAddress as `0x${string}`
      );
      await tx.wait();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["allowedTokens", LOCAL_CHAIN_ID],
        }),
        queryClient.invalidateQueries({
          queryKey: ["operations", LOCAL_CHAIN_ID],
        }),
      ]);

      setStatus("success");
      setNewTokenAddress("");
    } catch (error) {
      setStatus("error");
      setErrorMessage(extractErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="card">
        <p className="pill">Administración ejecutiva</p>
        <h2 className="section-heading text-xl">Panel del owner</h2>
        <p className="section-description">
          Dirección del owner:{" "}
          <span className="font-mono text-base">{ownerAddress ?? "desconocida"}</span>
        </p>
      </div>

      {!isOwner ? (
        <div className="card">
          <p className="pill">Acceso restringido</p>
          <h3 className="section-heading text-xl">Solo para el owner</h3>
          <p className="section-description">
            Conéctate con la dirección propietaria del contrato para habilitar las
            herramientas ejecutivas.
          </p>
        </div>
      ) : !isMetaMaskAvailable ? (
        <div className="card">
          <p className="pill">MetaMask requerida</p>
          <p className="section-description">
            Instala MetaMask para gestionar los tokens permitidos.
          </p>
        </div>
      ) : !isConnected ? (
        <div className="card flex flex-col gap-4">
          <div>
            <p className="pill">Conecta MetaMask</p>
            <p className="section-description">
              Conecta tu billetera para añadir nuevos tokens permitidos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConnect}
            className="button-primary"
            disabled={isConnecting}
          >
            {isConnecting ? "Conectando..." : "Conectar MetaMask"}
          </button>
          {errorMessage && (
            <div className="badge error">{errorMessage}</div>
          )}
        </div>
      ) : !isCorrectNetwork ? (
        <div className="card flex flex-col gap-4">
          <div>
            <p className="pill">Cambiar de red</p>
            <p className="section-description">
              Cambia MetaMask a la red Anvil (chainId {LOCAL_CHAIN_ID}) para gestionar
              los tokens permitidos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSwitchNetwork}
            className="button-primary"
          >
            Cambiar a Anvil
          </button>
          {errorMessage && (
            <div className="badge error">{errorMessage}</div>
          )}
        </div>
      ) : (
        <form className="card flex flex-col gap-4" onSubmit={onSubmit}>
          <div>
            <p className="pill">Tokens permitidos</p>
            <h3 className="section-heading text-xl">Añadir nuevo token</h3>
            <p className="section-description">
              Ingresa la dirección de un token ERC20 desplegado en Anvil para
              permitir su uso en el escrow.
            </p>
          </div>

          <label className="input-control">
            <span>Dirección del token</span>
            <input
              type="text"
              placeholder="0x..."
              value={newTokenAddress}
              onChange={(event) => setNewTokenAddress(event.target.value)}
              className="font-mono"
            />
          </label>

          <button
            type="submit"
            className="button-primary self-start"
            disabled={status === "pending"}
          >
            {status === "pending" ? "Añadiendo..." : "Añadir token"}
          </button>

          {status === "success" && (
            <div className="pill pill--accent">Token añadido correctamente.</div>
          )}

          {status === "error" && errorMessage && (
            <div className="badge error">Error: {errorMessage}</div>
          )}
        </form>
      )}

      <div className="card">
        <p className="pill">Inventario de tokens</p>
        <h3 className="section-heading text-xl">Tokens permitidos</h3>
        {tokens.length === 0 ? (
          <p className="section-description">
            No hay tokens registrados todavía.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tokens.map((token) => (
              <li
                key={token.address}
                className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/50 px-4 py-2 text-sm"
              >
                <span className="font-medium">
                  {token.symbol} · {token.name}
                </span>
                <span className="font-mono text-xs text-slate-400">
                  {token.address}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

