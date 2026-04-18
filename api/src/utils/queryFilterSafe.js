import { CONTRACT_DEPLOY_BLOCK } from '../config/blockchain.js';

const DEFAULT_BLOCK_CHUNK = 2000;

/**
 * @param {unknown} err
 * @returns {boolean}
 */
function isRpcRangeLimitError(err) {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('maximum RPC range limit')
    || message.includes('Requested range exceeds')
    || message.includes('-32005')
  );
}

/**
 * @param {import('ethers').Contract} contract
 * @returns {import('ethers').Provider}
 */
function getProviderFromContract(contract) {
  const runner = contract.runner;
  if (runner?.provider) return runner.provider;
  if (runner && typeof runner.getBlockNumber === 'function') return runner;
  if (contract.provider) return contract.provider;
  throw new Error('No se pudo resolver el provider del contrato.');
}

/**
 * eth_getLogs en rangos 0→latest falla en Besu con -32005.
 * Parte el rango en ventanas y reduce el chunk si hace falta.
 *
 * @param {import('ethers').Contract} contract
 * @param {import('ethers').DeferredTopicFilter} filter
 * @param {number} [fromBlock] — por defecto CONTRACT_DEPLOY_BLOCK (evita escanear desde génesis)
 * @param {number | 'latest'} [toBlock]
 * @param {number} [initialChunk]
 * @returns {Promise<import('ethers').Log[]>}
 */
export async function queryFilterSafe(contract, filter, fromBlock = CONTRACT_DEPLOY_BLOCK, toBlock = 'latest', initialChunk = DEFAULT_BLOCK_CHUNK) {
  try {
    return await contract.queryFilter(filter, fromBlock, toBlock);
  } catch (err) {
    if (!isRpcRangeLimitError(err)) throw err;
  }

  const provider = getProviderFromContract(contract);
  const latestBlock = toBlock === 'latest' ? await provider.getBlockNumber() : toBlock;
  /** @type {import('ethers').Log[]} */
  const events = [];

  let chunkSize = Math.max(1, initialChunk);
  let start = Math.max(0, fromBlock);

  while (start <= latestBlock) {
    const end = Math.min(latestBlock, start + chunkSize - 1);
    try {
      const batch = await contract.queryFilter(filter, start, end);
      events.push(...batch.filter((e) => 'args' in e));
      start = end + 1;
    } catch (err) {
      if (!isRpcRangeLimitError(err) || chunkSize === 1) throw err;
      chunkSize = Math.max(1, Math.floor(chunkSize / 2));
    }
  }

  return events;
}
