import { buildPermissionsTree } from '../services/permissions.service.js';

/**
 * POST /permissions/tree
 * Body: { address: "0x...", login: "admin" }
 */
export async function permissionsTree(request, reply) {
  const { address, login } = request.body;

  try {
    const result = await buildPermissionsTree(address, login);

    // Si el resultado tiene error, responder con el código apropiado
    if (result.error) {
      const statusMap = {
        800: 401, // cuenta no registrada
        801: 403, // usuario sin funcionalidades activas
        404: 404, // usuario no encontrado
      };
      const status = statusMap[result.error] ?? 400;
      return reply.status(status).send({
        error: result.error,
        message: result.message,
      });
    }

    // Todo válido: 200 con el árbol
    return reply.status(200).send(result);
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({
      error: 500,
      message: 'Error interno del servidor',
    });
  }
}
