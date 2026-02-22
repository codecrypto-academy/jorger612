import { getContract, ZERO_ADDRESS } from '../config/blockchain.js';

/**
 * Fase 1: Valida si la address está registrada y activa en CuentaAutorizada.
 * @param {string} address - Dirección de wallet (0x...)
 * @returns {{ valid: boolean, error?: { error: number, message: string } }}
 */
export async function isCuentaRegistrada(address) {
  const contract = getContract();
  const cuenta = await contract.cuentas(address);
  const hasWallet = cuenta.wallet && cuenta.wallet !== ZERO_ADDRESS;
  const isActive = cuenta.activa === true;

  if (!hasWallet || !isActive) {
    return { valid: false, error: { error: 800, message: 'cuenta no registrada' } };
  }
  return { valid: true };
}

/**
 * Busca un usuario por login usando eventos UsuarioCreado y UsuarioModificado.
 * @param {string} login - Login del usuario
 * @returns {Promise<{ id: number, login: string, nombre: string, rolId: number, activo: boolean } | null>}
 */
export async function findUsuarioByLogin(login) {
  const contract = getContract();
  const loginNorm = (login || '').trim().toLowerCase();
  if (!loginNorm) return null;

  const creados = await contract.queryFilter(contract.filters.UsuarioCreado(), 0, 'latest');
  const modificados = await contract.queryFilter(contract.filters.UsuarioModificado(), 0, 'latest');
  const allIds = new Set([
    ...creados.map((e) => Number(e.args[0])),
    ...modificados.map((e) => Number(e.args[0])),
  ]);

  for (const id of allIds) {
    const u = await contract.usuarios(id);
    if (u.id) {
      const uLogin = (u.login || '').toLowerCase();
      if (uLogin === loginNorm) {
        return {
          id: Number(u.id),
          login: u.login,
          nombre: u.nombre,
          rolId: Number(u.rolId),
          activo: u.activo,
        };
      }
    }
  }
  return null;
}

/**
 * Obtiene el rol por ID.
 */
export async function getRol(rolId) {
  const contract = getContract();
  const r = await contract.roles(rolId);
  return r.id ? { id: Number(r.id), nombre: r.nombre, activo: r.activo } : null;
}

/**
 * Obtiene los menús vinculados a un rol (solo activos).
 */
export async function getMenusActivosPorRol(rolId) {
  const contract = getContract();
  const menuIds = await contract.obtenerMenusPorRol(rolId);
  const menus = [];
  for (const id of menuIds) {
    const m = await contract.menus(id);
    if (m.id && m.activo) {
      menus.push({
        id: String(m.id),
        label: m.nombre,
        allowed: true,
      });
    }
  }
  return menus;
}
