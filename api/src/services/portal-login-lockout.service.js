/** Máximo de intentos fallidos antes del bloqueo temporal. */
export const MAX_PORTAL_LOGIN_ATTEMPTS = 3;

/** Duración del bloqueo tras agotar intentos (1 hora). */
export const PORTAL_LOCKOUT_MS = 60 * 60 * 1000;

/**
 * @param {import('mongodb').Document | null | undefined} doc
 */
export function getPortalFailedAttempts(doc) {
  const n = Number(doc?.portalLoginFailedAttempts);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * @param {import('mongodb').Document | null | undefined} doc
 */
export function getPortalRemainingAttempts(doc) {
  return Math.max(0, MAX_PORTAL_LOGIN_ATTEMPTS - getPortalFailedAttempts(doc));
}

/**
 * @param {import('mongodb').Document | null | undefined} doc
 * @returns {{ locked: boolean, lockedUntil?: Date, expired?: boolean }}
 */
export function getPortalLockState(doc) {
  const raw = doc?.portalLoginLockedUntil;
  if (!raw) return { locked: false };

  const lockedUntil = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(lockedUntil.getTime())) {
    return { locked: false, expired: true };
  }

  if (lockedUntil.getTime() > Date.now()) {
    return { locked: true, lockedUntil };
  }

  return { locked: false, expired: true };
}

/**
 * @param {import('mongodb').Collection} col
 * @param {import('mongodb').ObjectId} id
 */
export async function clearPortalLockFields(col, id) {
  await col.updateOne(
    { _id: id },
    {
      $set: {
        portalLoginFailedAttempts: 0,
        portalLoginLockedUntil: null,
        updatedAt: new Date(),
      },
    },
  );
}

/**
 * @param {import('mongodb').Collection} col
 * @param {import('mongodb').ObjectId} id
 */
export async function resetPortalLoginOnSuccess(col, id) {
  await clearPortalLockFields(col, id);
}
