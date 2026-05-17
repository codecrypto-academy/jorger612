export const PASSWORD_RULES_HINT =
  'Mínimo 6 caracteres, solo letras y números, al menos una mayúscula y un número. Sin caracteres especiales.';

export const PASSWORD_RULES_LIST = [
  'Mínimo 6 caracteres',
  'Solo letras (A–Z, a–z) y números (0–9); sin caracteres especiales',
  'Al menos una letra mayúscula',
  'Al menos un número',
] as const;

export function validatePassword(password: string): { ok: true } | { ok: false; message: string } {
  const p = password ?? '';

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

export function validatePasswordPair(
  password: string,
  confirm: string,
): { ok: true } | { ok: false; message: string } {
  const base = validatePassword(password);
  if (!base.ok) return base;
  if (password !== confirm) {
    return { ok: false, message: 'Las claves no coinciden.' };
  }
  return { ok: true };
}
