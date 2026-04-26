import {
  getRoles,
  getUsuarios,
  getMenus,
  getVinculos,
  getMenuAccess,
  getCuentas,
  getHistorialRol,
  getHistorialUsuario,
  getHistorialMenu,
  postInvalidate,
} from '../controllers/rbac-read.controller.js';

export async function rbacReadRoutes(fastify) {
  fastify.get('/roles', getRoles);
  fastify.get('/usuarios', getUsuarios);
  fastify.get('/menus', getMenus);
  fastify.get('/vinculos', getVinculos);
  fastify.get('/menu-access/:menuId', getMenuAccess);
  fastify.get('/cuentas', getCuentas);
  fastify.get('/historial/rol/:rolId', getHistorialRol);
  fastify.get('/historial/usuario/:usuarioId', getHistorialUsuario);
  fastify.get('/historial/menu/:menuId', getHistorialMenu);
  fastify.post('/invalidate', postInvalidate);
}
