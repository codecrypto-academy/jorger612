import { getMarketLeadsCollection } from '../db/mongo.js';
import { hashSetupToken, hashPassword } from '../services/password-crypto.service.js';
import { validatePasswordPair } from '../utils/passwordPolicy.js';
import { clearPortalLockFields } from '../services/portal-login-lockout.service.js';

function badRequest(reply, message) {
  return reply.code(400).send({ error: 'bad_request', message });
}

async function findLeadBySetupToken(token) {
  if (!token || typeof token !== 'string' || token.length < 20) {
    return null;
  }
  const tokenHash = hashSetupToken(token);
  const col = getMarketLeadsCollection();
  const doc = await col.findOne({
    passwordSetupTokenHash: tokenHash,
    passwordSetupExpiresAt: { $gt: new Date() },
  });
  return doc;
}

/**
 * GET /market/password-setup?token=
 * Devuelve wallet para mostrar en el formulario (sin datos sensibles).
 */
export async function getPasswordSetupInfo(request, reply) {
  const token = typeof request.query?.token === 'string' ? request.query.token.trim() : '';
  if (!token) {
    return badRequest(reply, 'Token obligatorio.');
  }

  const doc = await findLeadBySetupToken(token);
  if (!doc) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'El enlace no es válido o ha caducado. Solicite un nuevo registro o contacte al administrador.',
    });
  }

  return reply.send({
    walletAddress: doc.walletAddress,
    email: doc.email,
    isReset: Boolean(doc.passwordHash),
  });
}

/**
 * POST /market/password-setup
 * Body: { token, password, passwordConfirm }
 */
export async function completePasswordSetup(request, reply) {
  const body = request.body ?? {};
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const passwordConfirm = typeof body.passwordConfirm === 'string' ? body.passwordConfirm : '';

  if (!token) {
    return badRequest(reply, 'Token obligatorio.');
  }

  const validation = validatePasswordPair(password, passwordConfirm);
  if (!validation.ok) {
    return badRequest(reply, validation.message);
  }

  const doc = await findLeadBySetupToken(token);
  if (!doc) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'El enlace no es válido o ha caducado.',
    });
  }

  const passwordHash = await hashPassword(password);
  const col = getMarketLeadsCollection();
  const result = await col.updateOne(
    { _id: doc._id, passwordSetupTokenHash: doc.passwordSetupTokenHash },
    {
      $set: {
        passwordHash,
        passwordSetAt: new Date(),
        updatedAt: new Date(),
      },
      $unset: {
        passwordSetupTokenHash: '',
        passwordSetupExpiresAt: '',
      },
    },
  );

  if (result.matchedCount === 0) {
    return reply.code(409).send({
      error: 'conflict',
      message: 'No se pudo actualizar el registro. Intente de nuevo.',
    });
  }

  await clearPortalLockFields(col, doc._id);

  const wasReset = Boolean(doc.passwordHash);
  return reply.send({
    ok: true,
    walletAddress: doc.walletAddress,
    message: wasReset ? 'Clave restablecida correctamente.' : 'Clave establecida correctamente.',
    isReset: wasReset,
  });
}
