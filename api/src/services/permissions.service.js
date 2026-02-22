import {
  isCuentaRegistrada,
  findUsuarioByLogin,
  getRol,
  getMenusActivosPorRol,
} from './blockchain.service.js';

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
  // === Fase 1: Validar cuenta registrada ===
  const cuentaCheck = await isCuentaRegistrada(address);
  if (!cuentaCheck.valid) {
    return cuentaCheck.error;
  }

  // === Fase 2.1: Buscar usuario por login ===
  const usuario = await findUsuarioByLogin(login);
  if (!usuario) {
    return { error: 404, message: 'usuario no encontrado' };
  }

  // === Fase 2.2: Validar jerarquía - usuario activo ===
  if (!usuario.activo) {
    return { error: 801, message: 'Usuario sin funcionalidades Activas' };
  }

  // === Fase 2.3: Obtener rol y validar activo ===
  const rol = await getRol(usuario.rolId);
  if (!rol || !rol.activo) {
    return { error: 801, message: 'Usuario sin funcionalidades Activas' };
  }

  // === Fase 2.4: Obtener menús activos del rol ===
  const menu = await getMenusActivosPorRol(usuario.rolId);

  return {
    usuario: { id: usuario.id, login: usuario.login, nombre: usuario.nombre },
    rol: { id: usuario.rolId, nombre: rol.nombre },
    menu,
  };
}
