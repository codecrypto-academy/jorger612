import { Contract, EventLog, Provider } from 'ethers';
import { CONTRACT_DEPLOY_BLOCK } from '@/lib/contract';

const DEFAULT_BLOCK_CHUNK = 2_000;

function isRpcRangeLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return message.includes('maximum RPC range limit')
    || message.includes('Requested range exceeds')
    || message.includes('-32005');
}

function getProvider(contract: Contract): Provider {
  const runner = contract.runner as { provider?: Provider } | null;
  if (!runner) throw new Error('Contrato sin runner para consultar eventos.');
  if (runner.provider) return runner.provider;
  if (typeof (runner as Provider).getBlockNumber === 'function') return runner as Provider;
  throw new Error('No se pudo resolver el provider del contrato.');
}

export async function queryFilterSafe(
  contract: Contract,
  filter: Parameters<Contract['queryFilter']>[0],
  fromBlock: number = CONTRACT_DEPLOY_BLOCK,
  toBlock: number | 'latest' = 'latest',
  initialChunk = DEFAULT_BLOCK_CHUNK,
) {
  try {
    return await contract.queryFilter(filter, fromBlock, toBlock);
  } catch (err) {
    if (!isRpcRangeLimitError(err)) throw err;
  }

  const provider = getProvider(contract);
  const latestBlock = toBlock === 'latest' ? await provider.getBlockNumber() : toBlock;
  const events: EventLog[] = [];

  let chunkSize = Math.max(1, initialChunk);
  let start = Math.max(0, fromBlock);

  while (start <= latestBlock) {
    const end = Math.min(latestBlock, start + chunkSize - 1);
    try {
      const batch = await contract.queryFilter(filter, start, end);
      events.push(...batch.filter((e): e is EventLog => 'args' in e));
      start = end + 1;
    } catch (err) {
      if (!isRpcRangeLimitError(err) || chunkSize === 1) throw err;
      chunkSize = Math.max(1, Math.floor(chunkSize / 2));
    }
  }

  return events;
}
