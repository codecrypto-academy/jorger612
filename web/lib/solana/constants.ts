import { PublicKey } from "@solana/web3.js";

// Program ID - Update after running: cd academic_sol && anchor build && anchor keys list
export const PROGRAM_ID = new PublicKey("7992aXQLFQBb3MpGJG1tZPq9Ed4owWUK2D4bUiWXsBqQ");
export const CLUSTER = "localnet";
export const RPC_ENDPOINT = "http://localhost:8899";

export const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");

/** Direcciones de wallets con roles predefinidos */
export const ROLE_ADDRESSES = {
  ADMIN: new PublicKey("5JBvBxtkyen9f4R8FcxUXhkHtdSBqrwYbW9HCUiJUcKz"),
  CODE_CRYPTO: new PublicKey("41BkEjrkrZBAmeZSUejibRC5EvfUwMuQrn6krBxdGriL"),
  ESTUDIANTE: new PublicKey("3UgMMccpqc6dafbUYbdrEizmrDACizxdEKeWe1ALXqd1"),
  EMPLEADOR: new PublicKey("6i5HGzBDV7KxFTgWSyW4YQSJVqnZABwozY3LZfKXXrrh"),
} as const;

export type RoleType = "admin" | "codecrypto" | "estudiante" | "empleador" | null;
