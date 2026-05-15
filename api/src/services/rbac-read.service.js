import { ethers } from 'ethers';
import { getContract } from '../config/blockchain.js';
import { queryFilterSafe } from '../utils/queryFilterSafe.js';
import { getRedis, isRedisEnabled } from './redis.service.js';
import { getIndexedRolesList } from './permissions-index.service.js';

const CACHE_PREFIX = 'rbac:read-cache:v2';
const CACHE_TTL_SECONDS = Number(process.env.RBAC_READ_CACHE_TTL_SECONDS ?? 120);

export async function invalidateReadCache() {
  if (!isRedisEnabled()) return;
  const redis = getRedis();
  const keys = await redis.keys(`${CACHE_PREFIX}:*`);
  if (keys.length) await redis.del(...keys);
}

function normalizeAddress(address) {
  if (!address) return '';
  try {
    return ethers.getAddress(String(address).trim()).toLowerCase();
  } catch {
    return String(address).trim().toLowerCase();
  }
}

function cacheKey(resource, params = '') {
  return `${CACHE_PREFIX}:${resource}:${params}`;
}

async function withReadCache(resource, params, loader) {
  const key = cacheKey(resource, params);
  if (isRedisEnabled()) {
    const redis = getRedis();
    const raw = await redis.get(key);
    if (raw) return JSON.parse(raw);
    const data = await loader();
    await redis.set(key, JSON.stringify(data), 'EX', CACHE_TTL_SECONDS);
    return data;
  }
  return loader();
}

async function getEntityIds(contract, filterFactory) {
  const events = await queryFilterSafe(contract, filterFactory());
  return [...new Set(events.map((e) => Number(e.args[0])))]
    .filter((id) => Number.isFinite(id) && id > 0);
}

export async function listRoles({ account } = {}) {
  const accountNorm = normalizeAddress(account);
  return withReadCache('roles', accountNorm, async () => {
    if (isRedisEnabled()) {
      const indexed = await getIndexedRolesList(accountNorm);
      if (indexed !== null) {
        return indexed;
      }
    }

    const contract = getContract();
    if (typeof contract.obtenerTodosRoles === 'function') {
      const arr = await contract.obtenerTodosRoles();
      const rows = arr
        .map((r) => ({
          id: Number(r.id),
          nombre: String(r.nombre || ''),
          activo: Boolean(r.activo),
          timestamp: Number(r.timestamp || 0),
          ejecutor: String(r.ejecutor || ''),
        }))
        .filter((r) => r.id > 0);
      if (!accountNorm) return rows;
      return rows.filter((r) => normalizeAddress(r.ejecutor) === accountNorm);
    }

    const ids = await getEntityIds(contract, () => contract.filters.RolCreado());
    const rows = await Promise.all(ids.map(async (id) => {
      const r = await contract.roles(id);
      return {
        id: Number(r.id),
        nombre: String(r.nombre || ''),
        activo: Boolean(r.activo),
        timestamp: Number(r.timestamp || 0),
        ejecutor: String(r.ejecutor || ''),
      };
    }));
    const filtered = rows.filter((r) => r.id > 0);
    if (!accountNorm) return filtered;
    return filtered.filter((r) => normalizeAddress(r.ejecutor) === accountNorm);
  });
}

export async function listUsuarios({ account } = {}) {
  const accountNorm = normalizeAddress(account);
  return withReadCache('usuarios', accountNorm, async () => {
    const contract = getContract();
    const ids = await getEntityIds(contract, () => contract.filters.UsuarioCreado());
    const rows = await Promise.all(ids.map(async (id) => {
      const u = await contract.usuarios(id);
      return {
        id: Number(u.id),
        login: String(u.login || ''),
        nombre: String(u.nombre || ''),
        rolId: Number(u.rolId || 0),
        activo: Boolean(u.activo),
        timestamp: Number(u.timestamp || 0),
        ejecutor: String(u.ejecutor || ''),
      };
    }));
    const filtered = rows.filter((u) => u.id > 0);
    if (!accountNorm) return filtered;
    return filtered.filter((u) => normalizeAddress(u.ejecutor) === accountNorm);
  });
}

export async function listMenus({ account } = {}) {
  const accountNorm = normalizeAddress(account);
  return withReadCache('menus', accountNorm, async () => {
    const contract = getContract();
    const ids = await getEntityIds(contract, () => contract.filters.MenuCreado());
    const rows = await Promise.all(ids.map(async (id) => {
      const m = await contract.menus(id);
      return {
        id: Number(m.id),
        nombre: String(m.nombre || ''),
        activo: Boolean(m.activo),
        timestamp: Number(m.timestamp || 0),
        ejecutor: String(m.ejecutor || ''),
      };
    }));
    const filtered = rows.filter((m) => m.id > 0);
    if (!accountNorm) return filtered;
    return filtered.filter((m) => normalizeAddress(m.ejecutor) === accountNorm);
  });
}

export async function listVinculos({ rolId } = {}) {
  const rolFilter = Number(rolId || 0);
  return withReadCache('vinculos', String(rolFilter || 'all'), async () => {
    const contract = getContract();
    const roles = await listRoles();
    const targetRoles = rolFilter > 0 ? roles.filter((r) => r.id === rolFilter) : roles;
    const rows = [];
    for (const rol of targetRoles) {
      const ids = await contract.obtenerMenusPorRol(rol.id);
      rows.push({
        rolId: rol.id,
        menuIds: ids.map((id) => Number(id)),
      });
    }
    return rows;
  });
}

export async function getMenuAccessMap(menuId) {
  const mId = Number(menuId || 0);
  if (!mId) return [];
  return withReadCache('menu-access', String(mId), async () => {
    const vinculos = await listVinculos();
    return vinculos.map((v) => ({
      rolId: v.rolId,
      allowed: v.menuIds.includes(mId),
    }));
  });
}

export async function listCuentas() {
  return withReadCache('cuentas', 'all', async () => {
    const contract = getContract();
    if (typeof contract.filters.CuentaCreada !== 'function' || typeof contract.cuentas !== 'function') {
      return [];
    }
    const events = await queryFilterSafe(contract, contract.filters.CuentaCreada());
    const addresses = [...new Set(events.map((e) => String(e.args[0] || '')))].filter(Boolean);
    const rows = [];
    for (const addr of addresses) {
      const c = await contract.cuentas(addr);
      if (c.wallet && c.wallet !== ethers.ZeroAddress) {
        rows.push({
          wallet: c.wallet,
          nombre: String(c.nombre || ''),
          fechaHora: Number(c.fechaHora || 0),
          activa: Boolean(c.activa),
        });
      }
    }
    return rows;
  });
}

function sortHistorial(items) {
  items.sort((a, b) => (
    a.blockNumber !== b.blockNumber
      ? a.blockNumber - b.blockNumber
      : a.timestamp - b.timestamp
  ));
  return items;
}

function toHistorialItem(ev, action, detail) {
  return {
    accion: action,
    detalle: detail,
    ejecutor: String(ev.args?.ejecutor || ''),
    timestamp: Number(ev.args?.timestamp || 0),
    blockNumber: Number(ev.blockNumber || 0),
  };
}

export async function historialRol(rolId) {
  const id = Number(rolId || 0);
  return withReadCache('historial-rol', String(id), async () => {
    const contract = getContract();
    const [creados, modificados, inhabilitados] = await Promise.all([
      queryFilterSafe(contract, contract.filters.RolCreado(id)),
      queryFilterSafe(contract, contract.filters.RolModificado(id)),
      queryFilterSafe(contract, contract.filters.RolInhabilitado(id)),
    ]);
    return sortHistorial([
      ...creados.map((e) => toHistorialItem(e, 'Rol creado', String(e.args?.nombre ?? ''))),
      ...modificados.map((e) => toHistorialItem(e, 'Nombre modificado', `${String(e.args?.nombreAnterior ?? '')} → ${String(e.args?.nombreNuevo ?? '')}`)),
      ...inhabilitados.map((e) => toHistorialItem(e, 'Rol inhabilitado')),
    ]);
  });
}

export async function historialUsuario(usuarioId) {
  const id = Number(usuarioId || 0);
  return withReadCache('historial-usuario', String(id), async () => {
    const contract = getContract();
    const [creados, modificados, inhabilitados] = await Promise.all([
      queryFilterSafe(contract, contract.filters.UsuarioCreado(id)),
      queryFilterSafe(contract, contract.filters.UsuarioModificado(id)),
      queryFilterSafe(contract, contract.filters.UsuarioInhabilitado(id)),
    ]);
    return sortHistorial([
      ...creados.map((e) => toHistorialItem(e, 'Usuario creado', `${String(e.args?.login ?? '')} · ${String(e.args?.nombre ?? '')}`)),
      ...modificados.map((e) => toHistorialItem(e, 'Usuario modificado', `Rol #${String(e.args?.rolIdAnterior ?? '')} → Rol #${String(e.args?.rolIdNuevo ?? '')}`)),
      ...inhabilitados.map((e) => toHistorialItem(e, 'Usuario inhabilitado')),
    ]);
  });
}

export async function historialMenu(menuId) {
  const id = Number(menuId || 0);
  return withReadCache('historial-menu', String(id), async () => {
    const contract = getContract();
    const [creados, modificados, inhabilitados, vinculados, desvinculados] = await Promise.all([
      queryFilterSafe(contract, contract.filters.MenuCreado(id)),
      queryFilterSafe(contract, contract.filters.MenuModificado(id)),
      queryFilterSafe(contract, contract.filters.MenuInhabilitado(id)),
      queryFilterSafe(contract, contract.filters.MenuVinculadoARol(null, id)),
      queryFilterSafe(contract, contract.filters.MenuDesvinculadoDeRol(null, id)),
    ]);
    return sortHistorial([
      ...creados.map((e) => toHistorialItem(e, 'Menu creado', String(e.args?.nombre ?? ''))),
      ...modificados.map((e) => toHistorialItem(e, 'Nombre modificado', `${String(e.args?.nombreAnterior ?? '')} → ${String(e.args?.nombreNuevo ?? '')}`)),
      ...inhabilitados.map((e) => toHistorialItem(e, 'Menu inhabilitado')),
      ...vinculados.map((e) => toHistorialItem(e, `Vinculado a Rol #${Number(e.args?.rolId ?? 0)}`)),
      ...desvinculados.map((e) => toHistorialItem(e, `Desvinculado de Rol #${Number(e.args?.rolId ?? 0)}`)),
    ]);
  });
}
