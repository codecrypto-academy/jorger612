/**
 * Reenvía correo de establecer clave para un lead existente (por email).
 * Uso: node --env-file=.env scripts/resend-setup-email.mjs jorger612@gmail.com
 */
import { connectMongo, getMarketLeadsCollection } from '../src/db/mongo.js';
import { issuePasswordSetupForLead } from '../src/services/market-lead-password.service.js';

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Uso: node --env-file=.env scripts/resend-setup-email.mjs <email>');
  process.exit(1);
}

await connectMongo();
const col = getMarketLeadsCollection();
const lead = await col.findOne({ email }, { sort: { createdAt: -1 } });
if (!lead) {
  console.error('No hay lead con email:', email);
  process.exit(1);
}

const result = await issuePasswordSetupForLead(lead._id, {
  walletAddress: lead.walletAddress,
  email: lead.email,
  nombreApellido: lead.nombreApellido,
});

console.log('Lead:', lead._id.toString(), lead.walletAddress);
console.log('emailSent:', result.sent);
if (!result.sent) console.error('error:', result.error);
process.exit(result.sent ? 0 : 1);
