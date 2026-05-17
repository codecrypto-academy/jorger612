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
export async function sendPasswordSetupEmail({ to, walletAddress, setupToken, nombreApellido }) {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: 'RESEND_API_KEY no configurada' };
  }

  const setupUrl = `${getDappBaseUrl()}/market/establecer-clave?token=${encodeURIComponent(setupToken)}`;
  const greeting = nombreApellido ? `Hola ${nombreApellido},` : 'Hola,';
  const expiryHours = process.env.PASSWORD_SETUP_EXPIRES_HOURS || '72';

  const html = `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; line-height: 1.6; color: #1e293b;">
      <p>${greeting}</p>
      <p>Recibimos tu solicitud de acceso al <strong>Centro de Control RBAC</strong>.</p>
      <p>Para asignar la clave de acceso vinculada a tu wallet, abre el siguiente enlace:</p>
      <p style="margin: 24px 0;">
        <a href="${setupUrl}" style="display: inline-block; padding: 12px 20px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Establecer mi clave
        </a>
      </p>
      <p style="font-size: 13px; color: #64748b;">Wallet: <code>${walletAddress}</code></p>
      <p style="font-size: 13px; color: #64748b;">Si el botón no funciona, copia y pega esta URL en el navegador:<br/>
        <a href="${setupUrl}">${setupUrl}</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8;">Este enlace caduca en ${expiryHours} horas. Si no solicitaste este registro, ignora este mensaje.</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      subject: 'Establece tu clave de acceso — RBAC',
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
