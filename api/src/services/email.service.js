import { Resend } from 'resend';

function getResendClient() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function getFromAddress() {
  const raw = process.env.RESEND_FROM_EMAIL?.trim() || 'RBAC <onboarding@resend.dev>';
  if (raw.includes('<') && raw.includes('>')) return raw;
  return `RBAC <${raw}>`;
}

function getDappBaseUrl() {
  const base = process.env.DAPP_PUBLIC_URL?.trim() || 'http://localhost:3006';
  return base.replace(/\/$/, '');
}

/**
 * Envía correo con enlace para establecer clave de acceso.
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendPasswordSetupEmail({
  to,
  walletAddress,
  setupToken,
  nombreApellido,
  isReset = false,
}) {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: 'RESEND_API_KEY no configurada' };
  }

  const setupUrl = `${getDappBaseUrl()}/market/establecer-clave?token=${encodeURIComponent(setupToken)}`;
  const greeting = nombreApellido ? `Hola ${nombreApellido},` : 'Hola,';
  const expiryHours = process.env.PASSWORD_SETUP_EXPIRES_HOURS || '72';
  const intro = isReset
    ? 'Recibimos una solicitud para <strong>restablecer la clave</strong> de acceso al Centro de Control RBAC.'
    : 'Recibimos tu solicitud de acceso al <strong>Centro de Control RBAC</strong>.';
  const action = isReset
    ? 'Para definir una nueva clave vinculada a tu wallet, abre el siguiente enlace:'
    : 'Para asignar la clave de acceso vinculada a tu wallet, abre el siguiente enlace:';
  const buttonLabel = isReset ? 'Restablecer mi clave' : 'Establecer mi clave';
  const subject = isReset
    ? 'Restablece tu clave de acceso — RBAC'
    : 'Establece tu clave de acceso — RBAC';

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; line-height: 1.6; color: #1e293b;">
      <p>${greeting}</p>
      <p>${intro}</p>
      <p>${action}</p>
      <p style="margin: 24px 0;">
        <a href="${setupUrl}" style="display: inline-block; padding: 12px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          ${buttonLabel}
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Wallet: <code>${walletAddress}</code></p>
      <p style="font-size: 13px; color: #64748b;">Si el botón no funciona, copia y pega esta URL en el navegador:<br/>
        <a href="${setupUrl}">${setupUrl}</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8;">Este enlace caduca en ${expiryHours} horas. Si no solicitaste esto, ignora este mensaje.</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
    });
    if (error) {
      return { sent: false, error: error.message || String(error) };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Alerta por intento fallido de acceso al portal.
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendPortalLoginFailedEmail({
  to,
  walletAddress,
  nombreApellido,
  attemptNumber,
  maxAttempts,
  accountLocked,
  lockedUntil,
}) {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: 'RESEND_API_KEY no configurada' };
  }

  const greeting = nombreApellido ? `Hola ${nombreApellido},` : 'Hola,';
  const shortWallet = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
  const lockNote = accountLocked && lockedUntil
    ? `<p style="margin-top: 16px; padding: 12px 14px; background: #fef2f2; border-radius: 8px; color: #991b1b; font-size: 14px;">
        Tras ${maxAttempts} intentos fallidos, el acceso al portal quedó <strong>bloqueado durante 1 hora</strong>
        (hasta aprox. ${lockedUntil.toLocaleString('es-ES', { timeZone: 'UTC' })} UTC).
        Si no fuiste tú, cambia tu clave cuando puedas volver a entrar.
      </p>`
    : `<p style="font-size: 13px; color: #64748b;">
        Te quedan ${Math.max(0, maxAttempts - attemptNumber)} intento(s) antes de un bloqueo de 1 hora.
      </p>`;

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; line-height: 1.6; color: #1e293b;">
      <p>${greeting}</p>
      <p>Detectamos un <strong>intento fallido de acceso</strong> al Centro de Control RBAC con la wallet <code>${shortWallet}</code>.</p>
      <p style="font-size: 14px;">Intento fallido <strong>${attemptNumber}</strong> de ${maxAttempts}.</p>
      ${lockNote}
      <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
        Si no reconoces esta actividad, ignora este mensaje solo si estás seguro de que nadie más tiene acceso a tu wallet y correo.
      </p>
    </div>
  `;

  const subject = accountLocked
    ? 'Acceso al portal bloqueado — RBAC'
    : `Intento de acceso fallido (${attemptNumber}/${maxAttempts}) — RBAC`;

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
    });
    if (error) {
      return { sent: false, error: error.message || String(error) };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
