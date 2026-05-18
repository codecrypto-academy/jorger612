import { getMarketLeadsCollection } from '../db/mongo.js';
import { generateSetupToken, passwordSetupExpiryDate } from './password-crypto.service.js';
import { sendPasswordSetupEmail } from './email.service.js';

/**
 * Tras crear un lead, guarda token de setup y envía correo Resend.
 * @param {import('mongodb').ObjectId} leadId
 * @param {{ walletAddress: string, email: string, nombreApellido?: string }} lead
 * @param {{ warn?: (obj: object, msg: string) => void }} [log]
 */
export async function issuePasswordSetupForLead(leadId, lead, log, { isReset = false } = {}) {
  const { token, hash } = generateSetupToken();
  const passwordSetupExpiresAt = passwordSetupExpiryDate();

  const col = getMarketLeadsCollection();
  await col.updateOne(
    { _id: leadId },
    {
      $set: {
        passwordSetupTokenHash: hash,
        passwordSetupExpiresAt,
        updatedAt: new Date(),
      },
    },
  );

  const emailResult = await sendPasswordSetupEmail({
    to: lead.email,
    walletAddress: lead.walletAddress,
    setupToken: token,
    nombreApellido: lead.nombreApellido,
    isReset,
  });

  if (!emailResult.sent && log?.warn) {
    log.warn({ err: emailResult.error, leadId: leadId.toString() }, 'No se pudo enviar correo de establecer clave');
  }

  return emailResult;
}
