import { getContract, getProvider, CONTRACT_DEPLOY_BLOCK } from '../config/blockchain.js';
import { getRedis, isRedisEnabled } from './redis.service.js';

const KEY_PREFIX = 'rbac:idx:v1';
const META_LAST_BLOCK_KEY = `${KEY_PREFIX}:meta:lastProcessedBlock`;
const DEFAULT_CONFIRMATIONS = Number(process.env.INDEXER_CONFIRMATIONS ?? 6);
const DEFAULT_POLL_MS = Number(process.env.INDEXER_POLL_MS ?? 12000);
const DEFAULT_BLOCK_CHUNK = Number(process.env.INDEXER_BLOCK_CHUNK ?? 2000);

let running = false;
let timer = null;
let lastError = null;
let syncedToBlock = null;

function normLogin(login) {
  return String(login || '').trim().toLowerCase();
}

function keyUserByLogin(loginNorm) {
  return `${KEY_PREFIX}:user:byLogin:${loginNorm}`;
}

function keyUser(userId) {
  return `${KEY_PREFIX}:user:${userId}`;
}

function keyRole(rolId) {
  return `${KEY_PREFIX}:rol:${rolId}`;
}

function keyMenu(menuId) {
  return `${KEY_PREFIX}:menu:${menuId}`;
}

function keyMenusByRole(rolId) {
  return `${KEY_PREFIX}:rol:menus:${rolId}`;
}

function isRpcRangeLimitError(err) {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes('maximum RPC range limit')
    || message.includes('Requested range exceeds')
    || message.includes('-32005')
  );
}

async function upsertUser(contract, redis, userId) {
  const prevRaw = await redis.get(keyUser(userId));
  const prev = prevRaw ? JSON.parse(prevRaw) : null;

  const u = await contract.usuarios(userId);
  const current = {
    id: Number(u.id || 0),
    login: String(u.login || ''),
    nombre: String(u.nombre || ''),
    rolId: Number(u.rolId || 0),
    activo: Boolean(u.activo),
  };

  if (!current.id) {
    return;
  }

  const loginNorm = normLogin(current.login);
  const tx = redis.multi();
  tx.set(keyUser(userId), JSON.stringify(current));
  if (loginNorm) tx.set(keyUserByLogin(loginNorm), String(userId));

  const prevLoginNorm = prev?.login ? normLogin(prev.login) : '';
  if (prevLoginNorm && prevLoginNorm !== loginNorm) {
    tx.del(keyUserByLogin(prevLoginNorm));
  }
  await tx.exec();
}

async function upsertRole(contract, redis, rolId) {
  const r = await contract.roles(rolId);
  const current = {
    id: Number(r.id || 0),
    nombre: String(r.nombre || ''),
    activo: Boolean(r.activo),
  };
  if (!current.id) return;
  await redis.set(keyRole(rolId), JSON.stringify(current));
}

async function upsertMenu(contract, redis, menuId) {
  const m = await contract.menus(menuId);
  const current = {
    id: Number(m.id || 0),
    nombre: String(m.nombre || ''),
    activo: Boolean(m.activo),
  };
  if (!current.id) return;
  await redis.set(keyMenu(menuId), JSON.stringify(current));
}

async function rebuildMenusByRole(contract, redis, rolId) {
  const roleMenusKey = keyMenusByRole(rolId);
  const ids = await contract.obtenerMenusPorRol(rolId);
  const tx = redis.multi();
  tx.del(roleMenusKey);
  for (const id of ids) {
    tx.sadd(roleMenusKey, String(Number(id)));
  }
  await tx.exec();
}

async function processLog(contract, redis, parsed) {
  const { name, args } = parsed;
  if (name === 'UsuarioCreado' || name === 'UsuarioModificado' || name === 'UsuarioInhabilitado') {
    await upsertUser(contract, redis, Number(args.id));
    return;
  }
  if (name === 'RolCreado' || name === 'RolModificado' || name === 'RolInhabilitado') {
    const rolId = Number(args.id);
    await upsertRole(contract, redis, rolId);
    await rebuildMenusByRole(contract, redis, rolId);
    return;
  }
  if (name === 'MenuCreado' || name === 'MenuModificado' || name === 'MenuInhabilitado') {
    await upsertMenu(contract, redis, Number(args.id));
    return;
  }
  if (name === 'MenuVinculadoARol' || name === 'MenuDesvinculadoDeRol') {
    const rolId = Number(args.rolId);
    const menuId = Number(args.menuId);
    if (name === 'MenuVinculadoARol') {
      await redis.sadd(keyMenusByRole(rolId), String(menuId));
    } else {
      await redis.srem(keyMenusByRole(rolId), String(menuId));
    }
  }
}

async function fetchLogsChunked(provider, contractAddress, fromBlock, toBlock, initialChunk = DEFAULT_BLOCK_CHUNK) {
  const logs = [];
  let start = fromBlock;
  let chunkSize = Math.max(1, initialChunk);

  while (start <= toBlock) {
    const end = Math.min(toBlock, start + chunkSize - 1);
    try {
      const batch = await provider.getLogs({
        address: contractAddress,
        fromBlock: start,
        toBlock: end,
      });
      logs.push(...batch);
      start = end + 1;
    } catch (err) {
      if (!isRpcRangeLimitError(err) || chunkSize === 1) throw err;
      chunkSize = Math.max(1, Math.floor(chunkSize / 2));
    }
  }

  return logs;
}

async function syncIndexOnce() {
  if (!isRedisEnabled()) return;

  const redis = getRedis();
  const provider = getProvider();
  const contract = getContract();

  const latest = await provider.getBlockNumber();
  const safeHead = Math.max(CONTRACT_DEPLOY_BLOCK, latest - DEFAULT_CONFIRMATIONS);

  const persisted = await redis.get(META_LAST_BLOCK_KEY);
  const lastProcessed = persisted ? Number(persisted) : (CONTRACT_DEPLOY_BLOCK - 1);
  if (lastProcessed >= safeHead) {
    syncedToBlock = lastProcessed;
    return;
  }

  const fromBlock = Math.max(CONTRACT_DEPLOY_BLOCK, lastProcessed + 1);
  const logs = await fetchLogsChunked(provider, contract.target, fromBlock, safeHead);

  for (const log of logs) {
    let parsed = null;
    try {
      parsed = contract.interface.parseLog(log);
    } catch {
      parsed = null;
    }
    if (!parsed) continue;
    await processLog(contract, redis, parsed);
  }

  await redis.set(META_LAST_BLOCK_KEY, String(safeHead));
  syncedToBlock = safeHead;
}

async function runLoop(logger) {
  if (!running) return;
  try {
    await syncIndexOnce();
    lastError = null;
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err);
    logger.error({ err }, 'Fallo en indexador de permisos');
  } finally {
    if (running) {
      timer = setTimeout(() => runLoop(logger), DEFAULT_POLL_MS);
    }
  }
}

export async function startPermissionsIndexer(logger) {
  if (!isRedisEnabled() || running) return;
  running = true;
  await runLoop(logger);
}

export function stopPermissionsIndexer() {
  running = false;
  if (timer) clearTimeout(timer);
  timer = null;
}

export async function getIndexedPermissionsTree(login) {
  if (!isRedisEnabled()) return null;
  const loginNorm = normLogin(login);
  if (!loginNorm) return null;

  const redis = getRedis();
  const userId = await redis.get(keyUserByLogin(loginNorm));
  if (!userId) return null;

  const userRaw = await redis.get(keyUser(Number(userId)));
  if (!userRaw) return null;
  const usuario = JSON.parse(userRaw);
  if (!usuario?.id) return null;

  const rolRaw = await redis.get(keyRole(Number(usuario.rolId)));
  if (!rolRaw) return null;
  const rol = JSON.parse(rolRaw);

  const menuIds = await redis.smembers(keyMenusByRole(Number(usuario.rolId)));
  const menu = [];
  for (const menuIdRaw of menuIds) {
    const menuRaw = await redis.get(keyMenu(Number(menuIdRaw)));
    if (!menuRaw) continue;
    const m = JSON.parse(menuRaw);
    if (!m?.id || !m.activo) continue;
    menu.push({
      id: String(m.id),
      label: m.nombre,
      allowed: true,
    });
  }

  return {
    usuario: { id: usuario.id, login: usuario.login, nombre: usuario.nombre, activo: usuario.activo },
    rol: { id: rol.id, nombre: rol.nombre, activo: rol.activo },
    menu,
  };
}

export async function getIndexerStatus() {
  if (!isRedisEnabled()) {
    return { enabled: false, running: false };
  }
  const provider = getProvider();
  const latest = await provider.getBlockNumber();
  return {
    enabled: true,
    running,
    syncedToBlock,
    latestBlock: latest,
    lag: syncedToBlock == null ? null : Math.max(0, latest - syncedToBlock),
    lastError,
  };
}
