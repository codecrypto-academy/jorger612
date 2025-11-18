"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Contract,
  JsonRpcProvider,
  formatEther,
  formatUnits,
} from "ethers";

import { MOCK_ERC20_ABI } from "@/abi/mockErc20";
import { CONTRACT_ADDRESSES, LOCAL_RPC_URL } from "@/config/contracts";
import type { Operation } from "@/types/escrow";

type AccountCard = {
  label: string;
  address: `0x${string}`;
  balances: {
    eth: string;
    tka: string;
    tkb: string;
  };
};

type AccountDescriptor = {
  label: string;
  address: `0x${string}`;
};

const KNOWN_ACCOUNT_LABELS: Record<string, string> = {
  [CONTRACT_ADDRESSES.escrow.toLowerCase()]: "Escrow Contract",
  "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266": "Account #0",
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": "Account #1",
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": "Account #2",
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906": "Account #3",
  "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65": "Account #4",
  "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc": "Account #5",
  "0x976ea74026e726554db657fa54763abd0c3a0aa9": "Account #6",
  "0x14dc79964da2c08b23698b3d3cc7ca32193d9955": "Account #7",
  "0x23618e81e3f5cdf7f54c3d65f7fb0abf5b21e8f": "Account #8",
  "0xa0ee7a142d267c1f36714e4a8f75612f20a79720": "Account #9",
};

const formatNumber = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const isHexAddress = (value: string): value is `0x${string}` =>
  /^0x[0-9a-fA-F]{40}$/.test(value);

export function BalanceCards({ operations }: { operations: Operation[] }) {
  const provider = useMemo(() => new JsonRpcProvider(LOCAL_RPC_URL), []);
  const [data, setData] = useState<AccountCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetAccounts = useMemo<AccountDescriptor[]>(() => {
    const descriptors = new Map<string, AccountDescriptor>();

    const pushAccount = (address: `0x${string}`) => {
      if (!isHexAddress(address)) {
        return;
      }
      const lower = address.toLowerCase();
      if (descriptors.has(lower)) return;
      const label =
        KNOWN_ACCOUNT_LABELS[lower] ??
        `Operador ${address.slice(2, 6).toUpperCase()}`;
      descriptors.set(lower, { label, address });
    };

    pushAccount(CONTRACT_ADDRESSES.escrow);
    Object.keys(KNOWN_ACCOUNT_LABELS).forEach((addr) => {
      if (addr === CONTRACT_ADDRESSES.escrow.toLowerCase()) return;
      if (isHexAddress(addr)) {
        pushAccount(addr);
      }
    });

    operations.forEach((operation) => {
      if (isHexAddress(operation.user1)) {
        pushAccount(operation.user1);
      }
    });

    return Array.from(descriptors.values());
  }, [operations]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tkaContract = new Contract(
        CONTRACT_ADDRESSES.tokenA,
        MOCK_ERC20_ABI,
        provider
      );
      const tkbContract = new Contract(
        CONTRACT_ADDRESSES.tokenB,
        MOCK_ERC20_ABI,
        provider
      );

      const entries = await Promise.all(
        targetAccounts.map(async (account) => {
          const [eth, tka, tkb] = await Promise.all([
            provider.getBalance(account.address),
            tkaContract.balanceOf(account.address),
            tkbContract.balanceOf(account.address),
          ]);
          return {
            label: account.label,
            address: account.address,
            balances: {
              eth: formatNumber.format(Number(formatEther(eth))),
              tka: formatNumber.format(
                Number(formatUnits(tka, 18))
              ),
              tkb: formatNumber.format(
                Number(formatUnits(tkb, 18))
              ),
            },
          };
        })
      );
      setData(entries);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron obtener los balances."
      );
    } finally {
      setLoading(false);
    }
  }, [provider, targetAccounts]);

  useEffect(() => {
    refresh();
  }, [refresh, targetAccounts]);

  return (
    <div className="card flex flex-col gap-4">
      <div className="card-header">
        <div>
          <p className="pill">Balances de referencia</p>
          <h2 className="section-heading text-xl">Mesa de depuración</h2>
          <p className="section-description">
            Consulta los balances del contrato Escrow y de las cuentas
            precargadas en Anvil para validar rápidamente los escenarios de
            intercambio.
          </p>
        </div>
        <button
          type="button"
          className="button-ghost"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Actualizando…" : "Refrescar"}
        </button>
      </div>

      {error && <div className="badge error">{error}</div>}

      <div className="grid-panels">
        {data.map((account) => (
          <div key={account.address} className="card" style={{ padding: "1.5rem" }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-300">{account.label}</p>
                <p className="font-mono text-xs text-slate-500">
                  {account.address}
                </p>
              </div>
              <span className="badge">{account.balances.eth} ETH</span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">TKA</span>
                <span className="font-mono">{account.balances.tka}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">TKB</span>
                <span className="font-mono">{account.balances.tkb}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

