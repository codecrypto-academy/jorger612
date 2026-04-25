import {
  isCuentaRegistrada,
  findUsuarioByLogin,
  getRol,
  getMenusActivosPorRol,
} from './blockchain.service.js';
import {
  getCachedPermissionsTree,
  cachePermissionsTree,
  getSafeBlock,
} from './permissions-cache.service.js';
import { getIndexedPermissionsTree } from './permissions-index.service.js';

/**
 * Construye el árbol de permisos.
 * Fase 1: Valida cuenta registrada.
 * Fase 2: Busca usuario por login, valida jerarquía (usuario/rol activos), devuelve menús activos.
 *
 * @param {string} address - Dirección de wallet
 * @param {string} login - Login del usuario
 * @returns {Promise<{ error?: number, message?: string, usuario?: object, rol?: object, menu?: array }>}
 */
export async function buildPermissionsTree(address, login) {
  const safeBlock = await getSafeBlock();
  const cached = await getCachedPermissionsTree(address, login, safeBlock);
  if (cached) {
    return cached;
  }

  // === Fase 1: Validar cuenta registrada ===
  const cuentaCheck = await isCuentaRegistrada(address);
  if (!cuentaCheck.valid) {
    await cachePermissionsTree(address, login, safeBlock, cuentaCheck.error);
    return cuentaCheck.error;
  }

  const indexed = await getIndexedPermissionsTree(login);
  if (indexed) {
    if (!indexed.usuario.activo || !indexed.rol?.activo) {
      const inactiveResult = { error: 801, message: 'Usuario sin funcionalidades Activas' };
      await cachePermissionsTree(address, login, safeBlock, inactiveResult);
      return inactiveResult;
    }
    const successIndexed = {
      usuario: { id: indexed.usuario.id, login: indexed.usuario.login, nombre: indexed.usuario.nombre },
      rol: { id: indexed.rol.id, nombre: indexed.rol.nombre },
      menu: indexed.menu,
    };
    await cachePermissionsTree(address, login, safeBlock, successIndexed);
    return successIndexed;
  }

  // === Fase 2.1: Buscar usuario por login ===
  const usuario = await findUsuarioByLogin(login);
  if (!usuario) {
    const notFound = { error: 404, message: 'usuario no encontrado' };
    await cachePermissionsTree(address, login, safeBlock, notFound);
    return notFound;
  }

  // === Fase 2.2: Validar jerarquía - usuario activo ===
  if (!usuario.activo) {
    const inactiveUser = { error: 801, message: 'Usuario sin funcionalidades Activas' };
    await cachePermissionsTree(address, login, safeBlock, inactiveUser);
    return inactiveUser;
  }

  // === Fase 2.3: Obtener rol y validar activo ===
  const rol = await getRol(usuario.rolId);
  if (!rol || !rol.activo) {
    const inactiveRole = { error: 801, message: 'Usuario sin funcionalidades Activas' };
    await cachePermissionsTree(address, login, safeBlock, inactiveRole);
    return inactiveRole;
  }

  // === Fase 2.4: Obtener menús activos del rol ===
  const menu = await getMenusActivosPorRol(usuario.rolId);

  const response = {
    usuario: { id: usuario.id, login: usuario.login, nombre: usuario.nombre },
    rol: { id: usuario.rolId, nombre: rol.nombre },
    menu,
  };
  await cachePermissionsTree(address, login, safeBlock, response);
  return response;
}
