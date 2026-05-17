import { ethers } from 'ethers';
import { getMarketLeadsCollection } from '../db/mongo.js';
import { verifyPassword } from '../services/password-crypto.service.js';

function badRequest(reply, message) {
  return reply.code(400).send({ error: 'bad_request', message });
}

function unauthorized(reply, message) {
  return reply.code(401).send({ error: 'unauthorized', message });
}

async function findLeadByWallet(walletRaw) {
  if (!walletRaw || !ethers.isAddress(walletRaw)) {
    return { error: 'invalid_address' };
  }
  const walletAddress = ethers.getAddress(walletRaw);
  const col = getMarketLeadsCollection();
  const doc = await col.findOne(
    { walletAddress },
    { sort: { createdAt: -1 } },
  );
  return { walletAddress, doc };
}

/**
 * GET /market/portal-auth/status?wallet=0x...
 */
export async function getPortalAuthStatus(request, reply) {
  const wallet = typeof request.query?.wallet === 'string' ? request.query.wallet.trim() : '';
  const result = await findLeadByWallet(wallet);
  if (result.error === 'invalid_address') {
    return badRequest(reply, 'La dirección de wallet no es válida.');
  }

  const { walletAddress, doc } = result;
  const hasAccount = !!doc;
  const hasPassword = Boolean(doc?.passwordHash);
  const requiresPortalLogin = hasAccount && hasPassword;

  return reply.send({
    walletAddress,
    hasAccount,
    hasPassword,
    requiresPortalLogin,
    displayName: doc?.nombreApellido ?? '',
    email: doc?.email ?? '',
  });
}

/**
 * POST /market/portal-auth/login
 * Body: { walletAddress, password }
 */
export async function postPortalAuthLogin(request, reply) {
  const body = request.body ?? {};
  const wallet = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!password) {
    return badRequest(reply, 'La clave es obligatoria.');
  }

  const result = await findLeadByWallet(wallet);
  if (result.error === 'invalid_address') {
    return badRequest(reply, 'La dirección de wallet no es válida.');
  }

  const { walletAddress, doc } = result;
  if (!doc) {
    return reply.code(404).send({
      error: 'not_found',
      message: 'No hay registro para esta wallet. Complete el formulario Mi Primera Vez.',
    });
  }

  if (!doc.passwordHash) {
    return reply.code(403).send({
      error: 'password_not_set',
      message: 'Aún no ha establecido su clave. Revise el correo de activación.',
    });
  }

  const valid = await verifyPassword(password, doc.passwordHash);
  if (!valid) {
    return unauthorized(reply, 'Clave incorrecta.');
  }

  return reply.send({
    ok: true,
    walletAddress,
    nombreApellido: doc.nombreApellido ?? '',
    email: doc.email ?? '',
  });
}
