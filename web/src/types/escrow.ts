export type Operation = {
  id: bigint;
  user1: `0x${string}`;
  tokenA: `0x${string}`;
  tokenB: `0x${string}`;
  amountA: bigint;
  amountB: bigint;
  isActive: boolean;
  closedAt: bigint;
};

