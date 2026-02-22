import { permissionsTree } from '../controllers/permissions.controller.js';
import { permissionsTreeBodySchema, permissionsTreeResponseSchema } from '../schemas/permissions.schema.js';

export async function permissionsRoutes(fastify) {
  fastify.post('/permissions/tree', {
    schema: {
      description: 'Obtiene el árbol de permisos (usuario, rol, menús) por address y login',
      tags: ['permissions'],
      body: permissionsTreeBodySchema,
      response: permissionsTreeResponseSchema,
    },
  }, permissionsTree);
}
