import { ethers } from 'ethers';
import { getMarketLeadsCollection } from '../db/mongo.js';
import { verifyPassword } from '../services/password-crypto.service.js';
import { sendPortalLoginFailedEmail } from '../services/email.service.js';
import {
  MAX_PORTAL_LOGIN_ATTEMPTS,
  PORTAL_LOCKOUT_MS,
  clearPortalLockFields,
  getPortalFailedAttempts,
  getPortalLockState,
  getPortalRemainingAttempts,
  resetPortalLoginOnSuccess,
} from '../services/portal-login-lockout.service.js';

function badRequest(reply, message) {
  return reply.code(400).send({ error: 'bad_request', message });
}

function unauthorized(reply, message, extra = {}) {
  return reply.code(401).send({ error: 'unauthorized', message, ...extra });
}

function accountLocked(reply, lockedUntil) {
  const iso = lockedUntil.toISOString();
  return reply.code(429).send({
    error: 'account_locked',
    message:
      'Acceso bloqueado por 1 hora tras tres intentos fallidos. Revise su correo e inténtelo más tarde.',
    lockedUntil: iso,
    remainingAttempts: 0,
  });
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
  return { walletAddress, doc, col };
}

async function ensureLockStateFresh(col, doc) {
  const lock = getPortalLockState(doc);
  if (lock.expired) {
    await clearPortalLockFields(col, doc._id);
    return { ...doc, portalLoginFailedAttempts: 0, portalLoginLockedUntil: null };
  }
  return doc;
}

async function notifyFailedLogin(doc, { attemptNumber, accountLocked, lockedUntil }, log) {
  const email = typeof doc.email === 'string' ? doc.email.trim() : '';
  if (!email) return;

  const result = await sendPortalLoginFailedEmail({
    to: email,
    walletAddress: doc.walletAddress,
    nombreApellido: doc.nombreApellido,
    attemptNumber,
    maxAttempts: MAX_PORTAL_LOGIN_ATTEMPTS,
    accountLocked,
    lockedUntil,
  });

  if (!result.sent && log) {
    log.warn({ err: result.error }, 'No se pudo enviar alerta de login fallido');
  }
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

  let { walletAddress, doc, col } = result;
  if (doc) {
    doc = await ensureLockStateFresh(col, doc);
  }

  const hasAccount = !!doc;
  const hasPassword = Boolean(doc?.passwordHash);
  const requiresPortalLogin = hasAccount && hasPassword;
  const lock = getPortalLockState(doc);
  const isLocked = lock.locked;
  const remainingAttempts = isLocked ? 0 : getPortalRemainingAttempts(doc);

  return reply.send({
    walletAddress,
    hasAccount,
    hasPassword,
    requiresPortalLogin,
    displayName: doc?.nombreApellido ?? '',
    email: doc?.email ?? '',
    isLocked,
    lockedUntil: lock.lockedUntil?.toISOString() ?? null,
    remainingAttempts,
    maxAttempts: MAX_PORTAL_LOGIN_ATTEMPTS,
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

  let { walletAddress, doc, col } = result;
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

  doc = await ensureLockStateFresh(col, doc);

  const lockBefore = getPortalLockState(doc);
  if (lockBefore.locked && lockBefore.lockedUntil) {
    return accountLocked(reply, lockBefore.lockedUntil);
  }

  const valid = await verifyPassword(password, doc.passwordHash);
  if (!valid) {
    const currentFailed = getPortalFailedAttempts(doc);
    const attemptNumber = currentFailed + 1;

    if (attemptNumber >= MAX_PORTAL_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + PORTAL_LOCKOUT_MS);
      await col.updateOne(
        { _id: doc._id },
        {
          $set: {
            portalLoginFailedAttempts: 0,
            portalLoginLockedUntil: lockedUntil,
            updatedAt: new Date(),
          },
        },
      );

      void notifyFailedLogin(
        { ...doc, walletAddress },
        { attemptNumber: MAX_PORTAL_LOGIN_ATTEMPTS, accountLocked: true, lockedUntil },
        request.log,
      );

      return accountLocked(reply, lockedUntil);
    }

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          portalLoginFailedAttempts: attemptNumber,
          updatedAt: new Date(),
        },
      },
    );

    const remainingAttempts = MAX_PORTAL_LOGIN_ATTEMPTS - attemptNumber;

    void notifyFailedLogin(
      { ...doc, walletAddress },
      { attemptNumber, accountLocked: false, lockedUntil: null },
      request.log,
    );

    const attemptsWord = remainingAttempts === 1 ? 'intento' : 'intentos';
    return unauthorized(
      reply,
      `Clave incorrecta. Le quedan ${remainingAttempts} ${attemptsWord} antes del bloqueo de 1 hora.`,
      { remainingAttempts, maxAttempts: MAX_PORTAL_LOGIN_ATTEMPTS },
    );
  }

  await resetPortalLoginOnSuccess(col, doc._id);

  return reply.send({
    ok: true,
    walletAddress,
    nombreApellido: doc.nombreApellido ?? '',
    email: doc.email ?? '',
  });
}
