import { ethers } from 'ethers';
import { getContract, getProvider, CONTRACT_DEPLOY_BLOCK } from '../config/blockchain.js';
import { getRedis, isRedisEnabled } from './redis.service.js';

const KEY_PREFIX = 'rbac:idx:v1';
const META_LAST_BLOCK_KEY = `${KEY_PREFIX}:meta:lastProcessedBlock`;
/** Listas RBAC por ejecutor: backfill único vía obtenerTodos* en el indexador */
const ROLES_LIST_SCHEMA_KEY = `${KEY_PREFIX}:rol:listSchema`;
const USERS_LIST_SCHEMA_KEY = `${KEY_PREFIX}:user:listSchema`;
const MENUS_LIST_SCHEMA_KEY = `${KEY_PREFIX}:menu:listSchema`;
/** Histórico por entidad (ZSET); backfill único de logs + append en vivo (idempotente por miembro). */
const HISTORIAL_SCHEMA_KEY = `${KEY_PREFIX}:historial:listSchema`;
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

function keyRoleAllIds() {
  return `${KEY_PREFIX}:rol:allIds`;
}

function keyRolesByEjecutor(ejecutorNorm) {
  return `${KEY_PREFIX}:rol:byEjecutor:${ejecutorNorm}`;
}

function keyUserAllIds() {
  return `${KEY_PREFIX}:user:allIds`;
}

function keyUsersByEjecutor(ejecutorNorm) {
  return `${KEY_PREFIX}:user:byEjecutor:${ejecutorNorm}`;
}

function keyMenuAllIds() {
  return `${KEY_PREFIX}:menu:allIds`;
}

function keyMenusByEjecutor(ejecutorNorm) {
  return `${KEY_PREFIX}:menu:byEjecutor:${ejecutorNorm}`;
}

function keyHistorialRol(rolId) {
  return `${KEY_PREFIX}:historial:rol:${rolId}`;
}

function keyHistorialUsuario(usuarioId) {
  return `${KEY_PREFIX}:historial:usuario:${usuarioId}`;
}

function keyHistorialMenu(menuId) {
  return `${KEY_PREFIX}:historial:menu:${menuId}`;
}

function historialZMember(log, eventName) {
  const bn = log.blockNumber != null ? Number(log.blockNumber) : 0;
  const li = log.index != null ? Number(log.index) : 0;
  return `${bn}:${li}:${eventName}`;
}

function historialZScore(log) {
  const bn = log.blockNumber != null ? Number(log.blockNumber) : 0;
  const li = log.index != null ? Number(log.index) : 0;
  return bn * 1_000_000_000_000 + li;
}

/**
 * @param {import('ioredis').default} redis
 * @param {import('ethers').LogDescription} parsed
 * @param {import('ethers').Log} log
 */
async function appendHistorialFromParsed(redis, parsed, log) {
  const { name, args } = parsed;
  const blockNumber = log.blockNumber != null ? Number(log.blockNumber) : 0;
  const ts = Number(args?.timestamp ?? 0);
  const ejecutor = String(args?.ejecutor ?? '');
  const member = historialZMember(log, name);
  const score = historialZScore(log);

  /** @type {{ accion: string, detalle: string, ejecutor: string, timestamp: number, blockNumber: number } | null} */
  let item = null;
  /** @type {string | null} */
  let zkey = null;

  if (name === 'RolCreado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialRol(id);
    item = {
      accion: 'Rol creado',
      detalle: String(args?.nombre ?? ''),
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'RolModificado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialRol(id);
    item = {
      accion: 'Nombre modificado',
      detalle: `${String(args?.nombreAnterior ?? '')} → ${String(args?.nombreNuevo ?? '')}`,
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'RolInhabilitado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialRol(id);
    item = {
      accion: 'Rol inhabilitado',
      detalle: '',
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'UsuarioCreado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialUsuario(id);
    item = {
      accion: 'Usuario creado',
      detalle: `${String(args?.login ?? '')} · ${String(args?.nombre ?? '')}`,
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'UsuarioModificado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialUsuario(id);
    item = {
      accion: 'Usuario modificado',
      detalle: `Rol #${String(args?.rolIdAnterior ?? '')} → Rol #${String(args?.rolIdNuevo ?? '')}`,
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'UsuarioInhabilitado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialUsuario(id);
    item = {
      accion: 'Usuario inhabilitado',
      detalle: '',
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'MenuCreado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialMenu(id);
    item = {
      accion: 'Menu creado',
      detalle: String(args?.nombre ?? ''),
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'MenuModificado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialMenu(id);
    item = {
      accion: 'Nombre modificado',
      detalle: `${String(args?.nombreAnterior ?? '')} → ${String(args?.nombreNuevo ?? '')}`,
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'MenuInhabilitado') {
    const id = Number(args?.id ?? 0);
    if (!id) return;
    zkey = keyHistorialMenu(id);
    item = {
      accion: 'Menu inhabilitado',
      detalle: '',
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'MenuVinculadoARol') {
    const menuId = Number(args?.menuId ?? 0);
    const rolId = Number(args?.rolId ?? 0);
    if (!menuId) return;
    zkey = keyHistorialMenu(menuId);
    item = {
      accion: `Vinculado a Rol #${rolId}`,
      detalle: '',
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  } else if (name === 'MenuDesvinculadoDeRol') {
    const menuId = Number(args?.menuId ?? 0);
    const rolId = Number(args?.rolId ?? 0);
    if (!menuId) return;
    zkey = keyHistorialMenu(menuId);
    item = {
      accion: `Desvinculado de Rol #${rolId}`,
      detalle: '',
      ejecutor,
      timestamp: ts,
      blockNumber,
    };
  }

  if (!item || !zkey) return;
  const payload = JSON.stringify({ ...item, _zid: member });
  await redis.zadd(zkey, score, payload);
}

async function ensureHistorialBackfill(provider, contract, redis, logger) {
  if ((await redis.get(HISTORIAL_SCHEMA_KEY)) === 'v1') {
    return;
  }
  try {
    const latest = await provider.getBlockNumber();
    const safeHead = Math.max(CONTRACT_DEPLOY_BLOCK, latest - DEFAULT_CONFIRMATIONS);
    const logs = await fetchLogsChunked(provider, contract.target, CONTRACT_DEPLOY_BLOCK, safeHead);
    for (const log of logs) {
      let parsed = null;
      try {
        parsed = contract.interface.parseLog(log);
      } catch {
        parsed = null;
      }
      if (parsed) await appendHistorialFromParsed(redis, parsed, log);
    }
    await redis.set(HISTORIAL_SCHEMA_KEY, 'v1');
  } catch (err) {
    logger?.error({ err }, 'ensureHistorialBackfill falló');
  }
}

function normAddress(address) {
  if (!address) return '';
  try {
    return ethers.getAddress(String(address).trim()).toLowerCase();
  } catch {
    return String(address).trim().toLowerCase();
  }
}

async function clearRoleListSecondaryKeys(redis) {
  await redis.del(keyRoleAllIds());
  let cursor = '0';
  const pattern = `${KEY_PREFIX}:rol:byEjecutor:*`;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    cursor = next;
    if (keys.length) await redis.del(...keys);
  } while (cursor !== '0');
}

/**
 * Backfill único: 1× RPC obtenerTodosRoles + escrituras Redis (índice por ejecutor).
 */
async function ensureRolesListSecondaryIndex(contract, redis, logger) {
  if (typeof contract.obtenerTodosRoles !== 'function') {
    return;
  }
  const schema = await redis.get(ROLES_LIST_SCHEMA_KEY);
  if (schema === 'v2') {
    return;
  }
  try {
    const arr = await contract.obtenerTodosRoles();
    await clearRoleListSecondaryKeys(redis);
    const CHUNK = 80;
    for (let i = 0; i < arr.length; i += CHUNK) {
      const slice = arr.slice(i, i + CHUNK);
      const tx = redis.multi();
      for (const r of slice) {
        const id = Number(r.id || 0);
        if (!id) continue;
        const row = {
          id,
          nombre: String(r.nombre || ''),
          activo: Boolean(r.activo),
          timestamp: Number(r.timestamp || 0),
          ejecutor: String(r.ejecutor || ''),
        };
        tx.set(keyRole(id), JSON.stringify(row));
        tx.sadd(keyRoleAllIds(), String(id));
        const ej = normAddress(row.ejecutor);
        if (ej) tx.sadd(keyRolesByEjecutor(ej), String(id));
      }
      await tx.exec();
    }
    await redis.set(ROLES_LIST_SCHEMA_KEY, 'v2');
  } catch (err) {
    logger?.error({ err }, 'ensureRolesListSecondaryIndex falló');
  }
}

async function clearUsuarioListSecondaryKeys(redis) {
  await redis.del(keyUserAllIds());
  let cursor = '0';
  const pattern = `${KEY_PREFIX}:user:byEjecutor:*`;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    cursor = next;
    if (keys.length) await redis.del(...keys);
  } while (cursor !== '0');
}

async function ensureUsuariosListSecondaryIndex(contract, redis, logger) {
  if (typeof contract.obtenerTodosUsuarios !== 'function') {
    return;
  }
  if ((await redis.get(USERS_LIST_SCHEMA_KEY)) === 'v2') {
    return;
  }
  try {
    const arr = await contract.obtenerTodosUsuarios();
    await clearUsuarioListSecondaryKeys(redis);
    const CHUNK = 80;
    for (let i = 0; i < arr.length; i += CHUNK) {
      const slice = arr.slice(i, i + CHUNK);
      const tx = redis.multi();
      for (const u of slice) {
        const id = Number(u.id || 0);
        if (!id) continue;
        const row = {
          id,
          login: String(u.login || ''),
          nombre: String(u.nombre || ''),
          rolId: Number(u.rolId || 0),
          activo: Boolean(u.activo),
          timestamp: Number(u.timestamp || 0),
          ejecutor: String(u.ejecutor || ''),
        };
        tx.set(keyUser(id), JSON.stringify(row));
        const ln = normLogin(row.login);
        if (ln) tx.set(keyUserByLogin(ln), String(id));
        tx.sadd(keyUserAllIds(), String(id));
        const ej = normAddress(row.ejecutor);
        if (ej) tx.sadd(keyUsersByEjecutor(ej), String(id));
      }
      await tx.exec();
    }
    await redis.set(USERS_LIST_SCHEMA_KEY, 'v2');
  } catch (err) {
    logger?.error({ err }, 'ensureUsuariosListSecondaryIndex falló');
  }
}

async function clearMenuListSecondaryKeys(redis) {
  await redis.del(keyMenuAllIds());
  let cursor = '0';
  const pattern = `${KEY_PREFIX}:menu:byEjecutor:*`;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
    cursor = next;
    if (keys.length) await redis.del(...keys);
  } while (cursor !== '0');
}

async function ensureMenusListSecondaryIndex(contract, redis, logger) {
  if (typeof contract.obtenerTodosMenus !== 'function') {
    return;
  }
  if ((await redis.get(MENUS_LIST_SCHEMA_KEY)) === 'v2') {
    return;
  }
  try {
    const arr = await contract.obtenerTodosMenus();
    await clearMenuListSecondaryKeys(redis);
    const CHUNK = 80;
    for (let i = 0; i < arr.length; i += CHUNK) {
      const slice = arr.slice(i, i + CHUNK);
      const tx = redis.multi();
      for (const m of slice) {
        const id = Number(m.id || 0);
        if (!id) continue;
        const row = {
          id,
          nombre: String(m.nombre || ''),
          activo: Boolean(m.activo),
          timestamp: Number(m.timestamp || 0),
          ejecutor: String(m.ejecutor || ''),
        };
        tx.set(keyMenu(id), JSON.stringify(row));
        tx.sadd(keyMenuAllIds(), String(id));
        const ej = normAddress(row.ejecutor);
        if (ej) tx.sadd(keyMenusByEjecutor(ej), String(id));
      }
      await tx.exec();
    }
    await redis.set(MENUS_LIST_SCHEMA_KEY, 'v2');
  } catch (err) {
    logger?.error({ err }, 'ensureMenusListSecondaryIndex falló');
  }
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
    timestamp: Number(u.timestamp || 0),
    ejecutor: String(u.ejecutor || ''),
  };

  if (!current.id) {
    if (prev?.id) {
      const loginNorm = prev.login ? normLogin(prev.login) : '';
      const pe = prev.ejecutor ? normAddress(prev.ejecutor) : '';
      const tx = redis.multi();
      tx.del(keyUser(userId));
      if (loginNorm) tx.del(keyUserByLogin(loginNorm));
      tx.srem(keyUserAllIds(), String(userId));
      if (pe) tx.srem(keyUsersByEjecutor(pe), String(userId));
      await tx.exec();
    }
    return;
  }

  const loginNorm = normLogin(current.login);
  const ejecutorNorm = normAddress(current.ejecutor);
  const prevEj = prev?.ejecutor ? normAddress(prev.ejecutor) : '';

  const tx = redis.multi();
  tx.set(keyUser(userId), JSON.stringify(current));
  if (loginNorm) tx.set(keyUserByLogin(loginNorm), String(userId));
  tx.sadd(keyUserAllIds(), String(userId));
  if (prevEj && prevEj !== ejecutorNorm) {
    tx.srem(keyUsersByEjecutor(prevEj), String(userId));
  }
  if (ejecutorNorm) {
    tx.sadd(keyUsersByEjecutor(ejecutorNorm), String(userId));
  }

  const prevLoginNorm = prev?.login ? normLogin(prev.login) : '';
  if (prevLoginNorm && prevLoginNorm !== loginNorm) {
    tx.del(keyUserByLogin(prevLoginNorm));
  }
  await tx.exec();
}

async function upsertRole(contract, redis, rolId) {
  const prevRaw = await redis.get(keyRole(rolId));
  const prev = prevRaw ? JSON.parse(prevRaw) : null;

  const r = await contract.roles(rolId);
  const current = {
    id: Number(r.id || 0),
    nombre: String(r.nombre || ''),
    activo: Boolean(r.activo),
    timestamp: Number(r.timestamp || 0),
    ejecutor: String(r.ejecutor || ''),
  };

  if (!current.id) {
    if (prev?.id) {
      const tx = redis.multi();
      tx.del(keyRole(rolId));
      tx.srem(keyRoleAllIds(), String(rolId));
      const pe = prev.ejecutor ? normAddress(prev.ejecutor) : '';
      if (pe) tx.srem(keyRolesByEjecutor(pe), String(rolId));
      await tx.exec();
    }
    return;
  }

  const ejecutorNorm = normAddress(current.ejecutor);
  const prevEj = prev?.ejecutor ? normAddress(prev.ejecutor) : '';

  const tx = redis.multi();
  tx.set(keyRole(rolId), JSON.stringify(current));
  tx.sadd(keyRoleAllIds(), String(rolId));
  if (prevEj && prevEj !== ejecutorNorm) {
    tx.srem(keyRolesByEjecutor(prevEj), String(rolId));
  }
  if (ejecutorNorm) {
    tx.sadd(keyRolesByEjecutor(ejecutorNorm), String(rolId));
  }
  await tx.exec();
}

async function upsertMenu(contract, redis, menuId) {
  const prevRaw = await redis.get(keyMenu(menuId));
  const prev = prevRaw ? JSON.parse(prevRaw) : null;

  const m = await contract.menus(menuId);
  const current = {
    id: Number(m.id || 0),
    nombre: String(m.nombre || ''),
    activo: Boolean(m.activo),
    timestamp: Number(m.timestamp || 0),
    ejecutor: String(m.ejecutor || ''),
  };

  if (!current.id) {
    if (prev?.id) {
      const pe = prev.ejecutor ? normAddress(prev.ejecutor) : '';
      const tx = redis.multi();
      tx.del(keyMenu(menuId));
      tx.srem(keyMenuAllIds(), String(menuId));
      if (pe) tx.srem(keyMenusByEjecutor(pe), String(menuId));
      await tx.exec();
    }
    return;
  }

  const ejecutorNorm = normAddress(current.ejecutor);
  const prevEj = prev?.ejecutor ? normAddress(prev.ejecutor) : '';

  const tx = redis.multi();
  tx.set(keyMenu(menuId), JSON.stringify(current));
  tx.sadd(keyMenuAllIds(), String(menuId));
  if (prevEj && prevEj !== ejecutorNorm) {
    tx.srem(keyMenusByEjecutor(prevEj), String(menuId));
  }
  if (ejecutorNorm) {
    tx.sadd(keyMenusByEjecutor(ejecutorNorm), String(menuId));
  }
  await tx.exec();
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

async function processLog(contract, redis, parsed, log) {
  await appendHistorialFromParsed(redis, parsed, log);
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

async function syncIndexOnce(logger) {
  if (!isRedisEnabled()) return;

  const redis = getRedis();
  const provider = getProvider();
  const contract = getContract();

  await Promise.all([
    ensureRolesListSecondaryIndex(contract, redis, logger),
    ensureUsuariosListSecondaryIndex(contract, redis, logger),
    ensureMenusListSecondaryIndex(contract, redis, logger),
  ]);

  const latest = await provider.getBlockNumber();
  const safeHead = Math.max(CONTRACT_DEPLOY_BLOCK, latest - DEFAULT_CONFIRMATIONS);

  await ensureHistorialBackfill(provider, contract, redis, logger);

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
    await processLog(contract, redis, parsed, log);
  }

  await redis.set(META_LAST_BLOCK_KEY, String(safeHead));
  syncedToBlock = safeHead;
}

async function runLoop(logger) {
  if (!running) return;
  try {
    await syncIndexOnce(logger);
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

/**
 * Lista roles materializados en Redis (lectura O(roles) sin getLogs).
 * @param {string} accountNorm dirección checksummed lower, o '' para todos
 * @returns {Promise<null | Array<{ id: number, nombre: string, activo: boolean, timestamp: number, ejecutor: string }>>}
 *          null si el índice de listas aún no está listo (usar fallback on-chain).
 */
export async function getIndexedRolesList(accountNorm = '') {
  if (!isRedisEnabled()) return null;
  const redis = getRedis();
  if ((await redis.get(ROLES_LIST_SCHEMA_KEY)) !== 'v2') {
    return null;
  }

  let ids;
  if (accountNorm) {
    ids = await redis.smembers(keyRolesByEjecutor(accountNorm));
  } else {
    ids = await redis.smembers(keyRoleAllIds());
  }
  if (!ids.length) {
    return [];
  }

  const numericIds = [...new Set(ids.map((id) => Number(id)))].filter((n) => Number.isFinite(n) && n > 0);
  const keys = numericIds.map((id) => keyRole(id));
  const vals = await redis.mget(keys);
  /** @type {Array<{ id: number, nombre: string, activo: boolean, timestamp: number, ejecutor: string }>} */
  const rows = [];
  for (const raw of vals) {
    if (!raw) continue;
    try {
      const o = JSON.parse(raw);
      rows.push({
        id: Number(o.id),
        nombre: String(o.nombre || ''),
        activo: Boolean(o.activo),
        timestamp: Number(o.timestamp || 0),
        ejecutor: String(o.ejecutor || ''),
      });
    } catch {
      // ignorar entradas corruptas
    }
  }
  rows.sort((a, b) => a.id - b.id);
  const filtered = rows.filter((r) => r.id > 0);
  if (!accountNorm) return filtered;
  return filtered.filter((r) => normAddress(r.ejecutor) === accountNorm);
}

/**
 * @param {string} accountNorm
 * @returns {Promise<null | Array<{ id: number, login: string, nombre: string, rolId: number, activo: boolean, timestamp: number, ejecutor: string }>>}
 */
export async function getIndexedUsuariosList(accountNorm = '') {
  if (!isRedisEnabled()) return null;
  const redis = getRedis();
  if ((await redis.get(USERS_LIST_SCHEMA_KEY)) !== 'v2') {
    return null;
  }

  let ids;
  if (accountNorm) {
    ids = await redis.smembers(keyUsersByEjecutor(accountNorm));
  } else {
    ids = await redis.smembers(keyUserAllIds());
  }
  if (!ids.length) {
    return [];
  }

  const numericIds = [...new Set(ids.map((id) => Number(id)))].filter((n) => Number.isFinite(n) && n > 0);
  const keys = numericIds.map((id) => keyUser(id));
  const vals = await redis.mget(keys);
  /** @type {Array<{ id: number, login: string, nombre: string, rolId: number, activo: boolean, timestamp: number, ejecutor: string }>} */
  const rows = [];
  for (const raw of vals) {
    if (!raw) continue;
    try {
      const o = JSON.parse(raw);
      rows.push({
        id: Number(o.id),
        login: String(o.login || ''),
        nombre: String(o.nombre || ''),
        rolId: Number(o.rolId || 0),
        activo: Boolean(o.activo),
        timestamp: Number(o.timestamp || 0),
        ejecutor: String(o.ejecutor || ''),
      });
    } catch {
      // ignorar
    }
  }
  rows.sort((a, b) => a.id - b.id);
  const filtered = rows.filter((u) => u.id > 0);
  if (!accountNorm) return filtered;
  return filtered.filter((u) => normAddress(u.ejecutor) === accountNorm);
}

/**
 * @param {string} accountNorm
 * @returns {Promise<null | Array<{ id: number, nombre: string, activo: boolean, timestamp: number, ejecutor: string }>>}
 */
export async function getIndexedMenusList(accountNorm = '') {
  if (!isRedisEnabled()) return null;
  const redis = getRedis();
  if ((await redis.get(MENUS_LIST_SCHEMA_KEY)) !== 'v2') {
    return null;
  }

  let ids;
  if (accountNorm) {
    ids = await redis.smembers(keyMenusByEjecutor(accountNorm));
  } else {
    ids = await redis.smembers(keyMenuAllIds());
  }
  if (!ids.length) {
    return [];
  }

  const numericIds = [...new Set(ids.map((id) => Number(id)))].filter((n) => Number.isFinite(n) && n > 0);
  const keys = numericIds.map((id) => keyMenu(id));
  const vals = await redis.mget(keys);
  /** @type {Array<{ id: number, nombre: string, activo: boolean, timestamp: number, ejecutor: string }>} */
  const rows = [];
  for (const raw of vals) {
    if (!raw) continue;
    try {
      const o = JSON.parse(raw);
      rows.push({
        id: Number(o.id),
        nombre: String(o.nombre || ''),
        activo: Boolean(o.activo),
        timestamp: Number(o.timestamp || 0),
        ejecutor: String(o.ejecutor || ''),
      });
    } catch {
      // ignorar
    }
  }
  rows.sort((a, b) => a.id - b.id);
  const filtered = rows.filter((m) => m.id > 0);
  if (!accountNorm) return filtered;
  return filtered.filter((m) => normAddress(m.ejecutor) === accountNorm);
}

/**
 * Vínculos rol → menús desde Redis (sin listRoles ni obtenerMenusPorRol por petición).
 * @param {number} rolFilter 0 = todos los roles
 * @returns {Promise<null | Array<{ rolId: number, menuIds: number[] }>>}
 */
export async function getIndexedVinculosList(rolFilter = 0) {
  if (!isRedisEnabled()) return null;
  const redis = getRedis();
  if ((await redis.get(ROLES_LIST_SCHEMA_KEY)) !== 'v2') {
    return null;
  }

  const rf = Number(rolFilter || 0);
  /** @type {string[]} */
  let roleIds;
  if (rf > 0) {
    const exists = await redis.exists(keyRole(rf));
    roleIds = exists ? [String(rf)] : [];
  } else {
    roleIds = await redis.smembers(keyRoleAllIds());
  }

  const numericRoleIds = [...new Set(roleIds.map((id) => Number(id)))].filter((n) => Number.isFinite(n) && n > 0);
  /** @type {Array<{ rolId: number, menuIds: number[] }>} */
  const rows = [];
  for (const rid of numericRoleIds) {
    const menuIdStrs = await redis.smembers(keyMenusByRole(rid));
    const menuIds = menuIdStrs
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    rows.push({ rolId: rid, menuIds });
  }
  rows.sort((a, b) => a.rolId - b.rolId);
  return rows;
}

function parseHistorialZMember(raw) {
  try {
    const o = JSON.parse(raw);
    if (o && typeof o === 'object') delete o._zid;
    return o;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<null | Array<{ accion: string, detalle: string, ejecutor: string, timestamp: number, blockNumber: number }>>}
 */
export async function getIndexedHistorialRol(rolId) {
  const id = Number(rolId || 0);
  if (!id || !isRedisEnabled()) return null;
  const redis = getRedis();
  if ((await redis.get(HISTORIAL_SCHEMA_KEY)) !== 'v1') {
    return null;
  }
  const members = await redis.zrange(keyHistorialRol(id), 0, -1);
  const rows = members.map(parseHistorialZMember).filter(Boolean);
  rows.sort((a, b) => (
    a.blockNumber !== b.blockNumber
      ? a.blockNumber - b.blockNumber
      : a.timestamp - b.timestamp
  ));
  return rows;
}

export async function getIndexedHistorialUsuario(usuarioId) {
  const id = Number(usuarioId || 0);
  if (!id || !isRedisEnabled()) return null;
  const redis = getRedis();
  if ((await redis.get(HISTORIAL_SCHEMA_KEY)) !== 'v1') {
    return null;
  }
  const members = await redis.zrange(keyHistorialUsuario(id), 0, -1);
  const rows = members.map(parseHistorialZMember).filter(Boolean);
  rows.sort((a, b) => (
    a.blockNumber !== b.blockNumber
      ? a.blockNumber - b.blockNumber
      : a.timestamp - b.timestamp
  ));
  return rows;
}

export async function getIndexedHistorialMenu(menuId) {
  const id = Number(menuId || 0);
  if (!id || !isRedisEnabled()) return null;
  const redis = getRedis();
  if ((await redis.get(HISTORIAL_SCHEMA_KEY)) !== 'v1') {
    return null;
  }
  const members = await redis.zrange(keyHistorialMenu(id), 0, -1);
  const rows = members.map(parseHistorialZMember).filter(Boolean);
  rows.sort((a, b) => (
    a.blockNumber !== b.blockNumber
      ? a.blockNumber - b.blockNumber
      : a.timestamp - b.timestamp
  ));
  return rows;
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
