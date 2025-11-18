"use client";

import { useEffect, useMemo, useState } from "react";
import { Contract, parseUnits } from "ethers";
import { useQueryClient } from "@tanstack/react-query";

import { ESCROW_ABI } from "@/abi/escrow";
import { MOCK_ERC20_ABI } from "@/abi/mockErc20";
import { CONTRACT_ADDRESSES, LOCAL_CHAIN_ID } from "@/config/contracts";
import { useWeb3 } from "@/context/Web3Context";
import { extractErrorMessage } from "@/lib/errors";
import type { AllowedToken } from "@/hooks/useEscrow";

type FormState = {
  tokenA?: AllowedToken;
  tokenB?: AllowedToken;
  amountA: string;
  amountB: string;
};

type SubmissionState =
  | { status: "idle" }
  | { status: "approving" }
  | { status: "creating" }
  | { status: "success"; operationId: bigint }
  | { status: "error"; message: string };

export function CreateOperationForm({ tokens }: { tokens: AllowedToken[] }) {
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

  const [formState, setFormState] = useState<FormState>({
    tokenA: tokens[0],
    tokenB: tokens[1] ?? tokens[0],
    amountA: "",
    amountB: "",
  });

  const [status, setStatus] = useState<SubmissionState>({ status: "idle" });

  useEffect(() => {
    setFormState((prev) => ({
      tokenA: tokens[0] ?? prev.tokenA,
      tokenB: tokens[1] ?? prev.tokenB,
      amountA: "",
      amountB: "",
    }));
  }, [tokens]);

  const tokenOptions = useMemo(
    () =>
      tokens.map((token) => ({
        value: token.address,
        label: `${token.symbol} (${token.address.slice(0, 6)}…${token.address.slice(-4)})`,
      })),
    [tokens]
  );

  const handleConnect = async () => {
    setStatus({ status: "idle" });
    try {
      await connect();
    } catch (error) {
      setStatus({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo conectar con MetaMask.",
      });
    }
  };

  const handleSwitchNetwork = async () => {
    setStatus({ status: "idle" });
    try {
      await switchToLocalNetwork();
    } catch (error) {
      setStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "No se pudo cambiar de red.",
      });
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isMetaMaskAvailable) {
      setStatus({
        status: "error",
        message: "MetaMask no está disponible en este navegador.",
      });
      return;
    }

    if (!isConnected || !address || !signer) {
      setStatus({
        status: "error",
        message: "Conecta tu billetera para crear una operación.",
      });
      return;
    }

    if (!isCorrectNetwork) {
      setStatus({
        status: "error",
        message: "Debes cambiar a la red local de Anvil antes de operar.",
      });
      return;
    }

    const tokenA = formState.tokenA;
    const tokenB = formState.tokenB;

    if (!tokenA || !tokenB) {
      setStatus({
        status: "error",
        message: "Selecciona tokens válidos.",
      });
      return;
    }

    if (tokenA.address === tokenB.address) {
      setStatus({
        status: "error",
        message: "Los tokens deben ser distintos.",
      });
      return;
    }

    try {
      const amountA = parseUnits(formState.amountA || "0", tokenA.decimals);
      const amountB = parseUnits(formState.amountB || "0", tokenB.decimals);

      if (amountA <= 0n || amountB <= 0n) {
        throw new Error("Las cantidades deben ser mayores que cero.");
      }

      setStatus({ status: "approving" });

      const tokenContract = new Contract(tokenA.address, MOCK_ERC20_ABI, signer);
      const escrowContract = new Contract(
        CONTRACT_ADDRESSES.escrow,
        ESCROW_ABI,
        signer
      );

      const approveTx = await tokenContract.approve(
        CONTRACT_ADDRESSES.escrow,
        amountA
      );
      await approveTx.wait();

      setStatus({ status: "creating" });

      const createTx = await escrowContract.createOperation(
        tokenA.address,
        tokenB.address,
        amountA,
        amountB
      );
      await createTx.wait();

      const nextId = (await escrowContract.getNextOperationId()) as bigint;
      const operationId = nextId > 0n ? nextId - 1n : 0n;

      await queryClient.invalidateQueries({
        queryKey: ["operations", LOCAL_CHAIN_ID],
      });

      setStatus({ status: "success", operationId });
      setFormState((prev) => ({ ...prev, amountA: "", amountB: "" }));
    } catch (error) {
      setStatus({
        status: "error",
        message: extractErrorMessage(error),
      });
    }
  };

  if (!isMetaMaskAvailable) {
    return (
      <div className="card text-sm text-slate-300">
        Instala MetaMask para poder crear operaciones en el contrato Escrow.
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="card flex flex-col gap-3 text-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-sky-200">Conecta MetaMask</h2>
          <p className="text-sm text-slate-400">
            Necesitas conectar tu billetera para crear nuevas operaciones.
          </p>
        </div>
        <button
          type="button"
          onClick={handleConnect}
          className="self-start rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isConnecting}
        >
          {isConnecting ? "Conectando..." : "Conectar MetaMask"}
        </button>
        {status.status === "error" && (
          <p className="text-sm text-red-300">{status.message}</p>
        )}
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="card flex flex-col gap-3 text-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-sky-200">
            Cambia a la red local
          </h2>
          <p className="text-sm text-slate-400">
            Cambia MetaMask a la red Anvil (chainId {LOCAL_CHAIN_ID}) para crear
            operaciones.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSwitchNetwork}
          className="self-start rounded bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400"
        >
          Cambiar a Anvil
        </button>
        {status.status === "error" && (
          <p className="text-sm text-red-300">{status.message}</p>
        )}
      </div>
    );
  }

  return (
    <form className="card flex flex-col gap-5" onSubmit={onSubmit}>
      <div className="card-header">
        <div>
          <p className="pill">Nueva operación</p>
          <h2 className="section-heading text-xl lg:text-2xl">
            Configura tu intercambio P2P
          </h2>
          <p className="section-description">
            Define el token que cedes, la contraparte que recibes y deja que el contrato
            Escrow coordine el swap de forma segura.
          </p>
        </div>
      </div>

      <div className="input-grid">
        <label className="input-control">
          <span>Token que ofreces</span>
          <select
            value={formState.tokenA?.address ?? ""}
            onChange={(event) => {
              const selected = tokens.find(
                (token) => token.address === (event.target.value as `0x${string}`)
              );
              setFormState((prev) => ({ ...prev, tokenA: selected }));
            }}
          >
            <option value="">Selecciona un token</option>
            {tokenOptions.map((token) => (
              <option key={token.value} value={token.value}>
                {token.label}
              </option>
            ))}
          </select>
        </label>

        <label className="input-control">
          <span>Cantidad que ofreces ({formState.tokenA?.symbol ?? "—"})</span>
          <input
            type="number"
            min="0"
            step="any"
            required
            value={formState.amountA}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, amountA: event.target.value }))
            }
          />
        </label>

        <label className="input-control">
          <span>Token que solicitas</span>
          <select
            value={formState.tokenB?.address ?? ""}
            onChange={(event) => {
              const selected = tokens.find(
                (token) => token.address === (event.target.value as `0x${string}`)
              );
              setFormState((prev) => ({ ...prev, tokenB: selected }));
            }}
          >
            <option value="">Selecciona un token</option>
            {tokenOptions.map((token) => (
              <option key={token.value} value={token.value}>
                {token.label}
              </option>
            ))}
          </select>
        </label>

        <label className="input-control">
          <span>Cantidad que solicitas ({formState.tokenB?.symbol ?? "—"})</span>
          <input
            type="number"
            min="0"
            step="any"
            required
            value={formState.amountB}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, amountB: event.target.value }))
            }
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="button-primary"
          disabled={status.status === "approving" || status.status === "creating"}
        >
          {status.status === "approving"
            ? "Aprobando token..."
            : status.status === "creating"
              ? "Creando operación..."
              : "Crear operación"}
        </button>
        <span className="pill">
          {formState.tokenA?.symbol ?? "—"} → {formState.tokenB?.symbol ?? "—"}
        </span>
      </div>

      {status.status === "success" && (
        <div className="pill pill--accent">
          Operación creada · ID {status.operationId.toString()}
        </div>
      )}

      {status.status === "error" && (
        <div className="badge error">
          {status.message}
        </div>
      )}
    </form>
  );
}

