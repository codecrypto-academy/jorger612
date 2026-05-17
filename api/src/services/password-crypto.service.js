import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/** Cost factor bcrypt (OWASP: ajustar según capacidad del servidor; 12 es un buen equilibrio). */
const BCRYPT_ROUNDS = 12;

export function generateSetupToken() {
  const token = crypto.randomBytes(32).toString('base64url');
  const hash = hashSetupToken(token);
  return { token, hash };
}

export function hashSetupToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export function passwordSetupExpiryDate() {
  const hours = Number(process.env.PASSWORD_SETUP_EXPIRES_HOURS || 72);
  const ms = (Number.isFinite(hours) && hours > 0 ? hours : 72) * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}
