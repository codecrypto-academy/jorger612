/** Texto mostrado en la dapp (mantener alineado con dapp/src/lib/passwordPolicy.ts). */
export const PASSWORD_RULES_HINT =
  'Mínimo 6 caracteres, solo letras y números, al menos una mayúscula y un número. Sin caracteres especiales.';

/**
 * @param {string} password
 * @param {string} [confirm]
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validatePassword(password, confirm) {
  const p = typeof password === 'string' ? password : '';

  if (p.length < 6) {
    return { ok: false, message: 'La clave debe tener al menos 6 caracteres.' };
  }
  if (p.length > 128) {
    return { ok: false, message: 'La clave no puede superar 128 caracteres.' };
  }
  if (!/^[a-zA-Z0-9]+$/.test(p)) {
    return { ok: false, message: 'La clave solo puede contener letras y números (sin caracteres especiales).' };
  }
  if (!/[a-zA-Z]/.test(p)) {
    return { ok: false, message: 'La clave debe incluir al menos una letra.' };
  }
  if (!/[0-9]/.test(p)) {
    return { ok: false, message: 'La clave debe incluir al menos un número.' };
  }
  if (!/[A-Z]/.test(p)) {
    return { ok: false, message: 'La clave debe incluir al menos una letra mayúscula.' };
  }
  return { ok: true };
}

export function validatePasswordPair(password, confirm) {
  const base = validatePassword(password);
  if (!base.ok) return base;
  const c = typeof confirm === 'string' ? confirm : '';
  if (password !== c) {
    return { ok: false, message: 'Las claves no coinciden.' };
  }
  return { ok: true };
}
