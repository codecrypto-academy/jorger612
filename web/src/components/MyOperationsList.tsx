"use client";

import { useMemo, useState } from "react";
import { Contract, formatUnits } from "ethers";
import { useQueryClient } from "@tanstack/react-query";

import { ESCROW_ABI } from "@/abi/escrow";
import { CONTRACT_ADDRESSES, LOCAL_CHAIN_ID } from "@/config/contracts";
import { useWeb3 } from "@/context/Web3Context";
import { extractErrorMessage } from "@/lib/errors";
import type { AllowedToken } from "@/hooks/useEscrow";
import type { Operation } from "@/types/escrow";

export function MyOperationsList({
  operations,
  tokens,
}: {
  operations: Operation[];
  tokens: AllowedToken[];
}) {
  const {
    address,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    isMetaMaskAvailable,
    signer,
    connect,
    switchToLocalNetwork,
  } = useWeb3();
  const queryClient = useQueryClient();

  const [pendingCancellation, setPendingCancellation] =
    useState<bigint | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const metadataByAddress = useMemo(() => {
    const map = new Map<string, AllowedToken>();
    tokens.forEach((token) => map.set(token.address.toLowerCase(), token));
    return map;
  }, [tokens]);

  const myOperations = useMemo(
    () =>
      operations.filter(
        (operation) =>
          operation.isActive &&
          address &&
          operation.user1.toLowerCase() === address.toLowerCase()
      ),
    [operations, address]
  );

  const formatAmount = (value: bigint, tokenAddress: string) => {
    const metadata = metadataByAddress.get(tokenAddress.toLowerCase());
    if (!metadata) {
      return `${value} (sin decimales)`;
    }
    return `${formatUnits(value, metadata.decimals)} ${metadata.symbol}`;
  };

  const formatAddress = (value: string) =>
    `${value.slice(0, 6)}…${value.slice(-4)}`;

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

  const cancelOperation = async (operationId: bigint) => {
    if (!signer) {
      setErrorMessage("Conecta MetaMask para cancelar una operación.");
      return;
    }
    if (!isCorrectNetwork) {
      setErrorMessage("Debes cambiar a la red local antes de cancelar.");
      return;
    }

    try {
      setPendingCancellation(operationId);
      setErrorMessage(null);

      const escrowContract = new Contract(
        CONTRACT_ADDRESSES.escrow,
        ESCROW_ABI,
        signer
      );

      const tx = await escrowContract.cancelOperation(operationId);
      await tx.wait();

      await queryClient.invalidateQueries({
        queryKey: ["operations", LOCAL_CHAIN_ID],
      });
    } catch (error) {
      setErrorMessage(`Error al cancelar: ${extractErrorMessage(error)}`);
    } finally {
      setPendingCancellation(null);
    }
  };

  if (!isMetaMaskAvailable) {
    return (
      <div className="card">
        <p className="pill">Operaciones activas</p>
        <h2 className="section-heading text-xl">MetaMask es necesaria</h2>
        <p className="section-description">
          Instala MetaMask para consultar y cancelar las operaciones que has
          creado en el contrato Escrow.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card flex flex-col gap-4">
        <div>
          <p className="pill">Operaciones activas</p>
          <h2 className="section-heading text-xl">Conecta tu billetera</h2>
          <p className="section-description">
            Conecta MetaMask para revisar el portafolio de operaciones abiertas y
            cancelarlas si es necesario.
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
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="card flex flex-col gap-4">
        <div>
          <p className="pill">Operaciones activas</p>
          <h2 className="section-heading text-xl">Cambia a la red local</h2>
          <p className="section-description">
            Cambia MetaMask a la red Anvil (chainId {LOCAL_CHAIN_ID}) para
            administrar tus operaciones bloqueadas en el contrato.
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
    );
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="card-header">
        <div>
          <p className="pill">Mis operaciones</p>
          <h2 className="section-heading text-xl">Operaciones activas</h2>
          <p className="section-description">
            Monitorea las propuestas que has abierto. Cancela aquellas que ya no
            quieras ofrecer.
          </p>
        </div>
        <span className="badge">
          {myOperations.length} activas
        </span>
      </div>

      {myOperations.length === 0 ? (
        <p className="section-description">
          No tienes operaciones activas en este momento.
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ofreces</th>
                <th>Solicitas</th>
                <th>Token A</th>
                <th>Token B</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {myOperations.map((operation) => (
                <tr key={operation.id.toString()}>
                  <td className="font-mono">{operation.id.toString()}</td>
                  <td>{formatAmount(operation.amountA, operation.tokenA)}</td>
                  <td>{formatAmount(operation.amountB, operation.tokenB)}</td>
                  <td className="font-mono">{formatAddress(operation.tokenA)}</td>
                  <td className="font-mono">{formatAddress(operation.tokenB)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => cancelOperation(operation.id)}
                      className="button-ghost"
                      disabled={pendingCancellation !== null}
                    >
                      {pendingCancellation === operation.id
                        ? "Cancelando..."
                        : "Cancelar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {errorMessage && myOperations.length > 0 && (
        <div className="badge error">{errorMessage}</div>
      )}
    </div>
  );
}

