import {
  listRoles,
  listUsuarios,
  listMenus,
  listVinculos,
  getMenuAccessMap,
  listCuentas,
  historialRol,
  historialUsuario,
  historialMenu,
  listActividadReciente,
  invalidateReadCache,
} from '../services/rbac-read.service.js';

export async function postInvalidate(_request, reply) {
  await invalidateReadCache();
  return reply.send({ ok: true });
}

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

export async function getRoles(request, reply) {
  const rows = await listRoles({ account: request.query?.account });
  return reply.send({ items: rows });
}

export async function getUsuarios(request, reply) {
  const rows = await listUsuarios({ account: request.query?.account });
  return reply.send({ items: rows });
}

export async function getMenus(request, reply) {
  const rows = await listMenus({ account: request.query?.account });
  return reply.send({ items: rows });
}

export async function getVinculos(request, reply) {
  const rolId = request.query?.rolId ? parsePositiveInt(request.query.rolId) : null;
  const rows = await listVinculos({ rolId: rolId ?? undefined });
  return reply.send({ items: rows });
}

export async function getMenuAccess(request, reply) {
  const menuId = parsePositiveInt(request.params?.menuId);
  if (!menuId) {
    return reply.code(400).send({ error: 'bad_request', message: 'menuId inválido' });
  }
  const rows = await getMenuAccessMap(menuId);
  return reply.send({ menuId, items: rows });
}

export async function getCuentas(request, reply) {
  const rows = await listCuentas();
  return reply.send({ items: rows });
}

export async function getHistorialRol(request, reply) {
  const rolId = parsePositiveInt(request.params?.rolId);
  if (!rolId) {
    return reply.code(400).send({ error: 'bad_request', message: 'rolId inválido' });
  }
  const rows = await historialRol(rolId);
  return reply.send({ items: rows });
}

export async function getHistorialUsuario(request, reply) {
  const usuarioId = parsePositiveInt(request.params?.usuarioId);
  if (!usuarioId) {
    return reply.code(400).send({ error: 'bad_request', message: 'usuarioId inválido' });
  }
  const rows = await historialUsuario(usuarioId);
  return reply.send({ items: rows });
}

export async function getActividadReciente(request, reply) {
  const limit = request.query?.limit ? parsePositiveInt(request.query.limit) : 10;
  const rows = await listActividadReciente({ limit: limit ?? 10 });
  return reply.send({ items: rows });
}

export async function getHistorialMenu(request, reply) {
  const menuId = parsePositiveInt(request.params?.menuId);
  if (!menuId) {
    return reply.code(400).send({ error: 'bad_request', message: 'menuId inválido' });
  }
  const rows = await historialMenu(menuId);
  return reply.send({ items: rows });
}
