"use client";

import { useQuery } from "@tanstack/react-query";
import { Contract, JsonRpcProvider } from "ethers";

import { ESCROW_ABI } from "@/abi/escrow";
import { MOCK_ERC20_ABI } from "@/abi/mockErc20";
import { CONTRACT_ADDRESSES, LOCAL_CHAIN_ID, LOCAL_RPC_URL } from "@/config/contracts";
import type { Operation } from "@/types/escrow";

export type AllowedToken = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
};

const rpcProvider = new JsonRpcProvider(LOCAL_RPC_URL, LOCAL_CHAIN_ID);
const escrowReadContract = new Contract(
  CONTRACT_ADDRESSES.escrow,
  ESCROW_ABI,
  rpcProvider
);

async function fetchAllowedTokens(): Promise<AllowedToken[]> {
  const addresses = (await escrowReadContract.getAllowedTokens()) as `0x${string}`[];

  const tokens = await Promise.all(
    addresses.map(async (address) => {
      const tokenContract = new Contract(address, MOCK_ERC20_ABI, rpcProvider);
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
      ]);

      return {
        address,
        symbol: String(symbol),
        name: String(name),
        decimals: Number(decimals),
      };
    })
  );

  return tokens;
}

async function fetchOperations(): Promise<Operation[]> {
  const rawOperations = (await escrowReadContract.getAllOperations()) as Operation[];
  return rawOperations;
}

async function fetchOwner(): Promise<`0x${string}` | undefined> {
  const owner = (await escrowReadContract.owner()) as `0x${string}`;
  return owner;
}

export function useAllowedTokens() {
  return useQuery({
    queryKey: ["allowedTokens", LOCAL_CHAIN_ID],
    queryFn: fetchAllowedTokens,
    refetchInterval: 15000,
  });
}

export function useOperations() {
  return useQuery({
    queryKey: ["operations", LOCAL_CHAIN_ID],
    queryFn: fetchOperations,
    refetchInterval: 10000,
    structuralSharing: false,
  });
}

export function useEscrowOwner() {
  return useQuery({
    queryKey: ["escrowOwner", LOCAL_CHAIN_ID],
    queryFn: fetchOwner,
    refetchInterval: 60000,
  });
}
