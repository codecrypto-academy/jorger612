"use client";

import { useMemo, useState } from "react";
import { Contract, formatUnits } from "ethers";
import { useQueryClient } from "@tanstack/react-query";

import { ESCROW_ABI } from "@/abi/escrow";
import { MOCK_ERC20_ABI } from "@/abi/mockErc20";
import { CONTRACT_ADDRESSES, LOCAL_CHAIN_ID } from "@/config/contracts";
import { useWeb3 } from "@/context/Web3Context";
import { extractErrorMessage } from "@/lib/errors";
import type { AllowedToken } from "@/hooks/useEscrow";
import type { Operation } from "@/types/escrow";

type PendingState =
  | null
  | {
      operationId: bigint;
      step: "approving" | "completing";
    };

export function AvailableOperationsList({
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

  const [pending, setPending] = useState<PendingState>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const metadataByAddress = useMemo(() => {
    const map = new Map<string, AllowedToken>();
    tokens.forEach((token) => map.set(token.address.toLowerCase(), token));
    return map;
  }, [tokens]);

  const availableOperations = useMemo(
    () =>
      operations.filter(
        (operation) =>
          operation.isActive &&
          (!address ||
            operation.user1.toLowerCase() !== address.toLowerCase())
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

  const completeOperation = async (operation: Operation) => {
    if (!signer) {
      setErrorMessage("Conecta MetaMask para completar una operación.");
      return;
    }
    if (!isCorrectNetwork) {
      setErrorMessage("Debes cambiar a la red local antes de completar.");
      return;
    }

    const tokenMetadata = metadataByAddress.get(operation.tokenB.toLowerCase());
    if (!tokenMetadata) {
      setErrorMessage("No se pudo obtener la información del token solicitado.");
      return;
    }

    try {
      setPending({ operationId: operation.id, step: "approving" });
      setErrorMessage(null);

      const tokenContract = new Contract(
        operation.tokenB,
        MOCK_ERC20_ABI,
        signer
      );
      const escrowContract = new Contract(
        CONTRACT_ADDRESSES.escrow,
        ESCROW_ABI,
        signer
      );

      const approveTx = await tokenContract.approve(
        CONTRACT_ADDRESSES.escrow,
        operation.amountB
      );
      await approveTx.wait();

      setPending({ operationId: operation.id, step: "completing" });

      const completeTx = await escrowContract.completeOperation(
        operation.id
      );
      await completeTx.wait();

      await queryClient.invalidateQueries({
        queryKey: ["operations", LOCAL_CHAIN_ID],
      });
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setPending(null);
    }
  };

  if (!isMetaMaskAvailable) {
    return (
      <div className="card">
        <p className="pill">Operaciones disponibles</p>
        <h2 className="section-heading text-xl">Instala MetaMask</h2>
        <p className="section-description">
          Necesitas MetaMask para explorar y completar las operaciones abiertas
          por otros usuarios.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card flex flex-col gap-4">
        <div>
          <p className="pill">Operaciones disponibles</p>
          <h2 className="section-heading text-xl">Conecta tu billetera</h2>
          <p className="section-description">
            Descubre operaciones activas creadas por otros usuarios y completa el swap
            en dos pasos.
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
          <p className="pill">Operaciones disponibles</p>
          <h2 className="section-heading text-xl">Cambia a la red local</h2>
          <p className="section-description">
            Cambia MetaMask a la red Anvil (chainId {LOCAL_CHAIN_ID}) para completar
            operaciones disponibles sin fricciones.
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
          <p className="pill">Operaciones disponibles</p>
          <h2 className="section-heading text-xl">Desk de intercambios</h2>
          <p className="section-description">
            Encuentra propuestas activas y completa el intercambio aprobando el token
            solicitado y ejecutando el swap.
          </p>
        </div>
        <span className="badge">
          {availableOperations.length} oportunidades
        </span>
      </div>

      {availableOperations.length === 0 ? (
        <p className="section-description">
          No hay operaciones disponibles creadas por otros usuarios.
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Creador</th>
                <th>Debes aprobar</th>
                <th>Recibirás</th>
                <th>Token solicitado</th>
                <th>Token ofrecido</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {availableOperations.map((operation) => (
                <tr key={operation.id.toString()}>
                  <td className="font-mono">{operation.id.toString()}</td>
                  <td className="font-mono">{formatAddress(operation.user1)}</td>
                  <td>{formatAmount(operation.amountB, operation.tokenB)}</td>
                  <td>{formatAmount(operation.amountA, operation.tokenA)}</td>
                  <td className="font-mono">{formatAddress(operation.tokenB)}</td>
                  <td className="font-mono">{formatAddress(operation.tokenA)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => completeOperation(operation)}
                      className="button-primary"
                      disabled={pending !== null}
                    >
                      {pending?.operationId === operation.id
                        ? pending.step === "approving"
                          ? "Aprobando..."
                          : "Completando..."
                        : "Completar intercambio"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {errorMessage && (
        <div className="badge error">Error: {errorMessage}</div>
      )}
    </div>
  );
}

