/**
 * Prueba de envío Resend (usa api/.env).
 * Uso: node --env-file=.env scripts/test-resend.mjs [email]
 */
import { Resend } from 'resend';

const to = process.argv[2] || 'jorger612@gmail.com';
const key = process.env.RESEND_API_KEY?.trim();
let from = process.env.RESEND_FROM_EMAIL?.trim() || 'RBAC <onboarding@resend.dev>';
if (from && !from.includes('<')) {
  from = `RBAC <${from}>`;
}

if (!key) {
  console.error('RESEND_API_KEY no definida en .env');
  process.exit(1);
}

console.log('To:', to);
console.log('From:', from);
console.log('DAPP_PUBLIC_URL:', process.env.DAPP_PUBLIC_URL || '(default)');

const resend = new Resend(key);
const { data, error } = await resend.emails.send({
  from,
  to: [to],
  subject: 'Prueba RBAC — establecer clave',
  html: '<p>Correo de prueba del flujo Resend en RBAC API.</p>',
});

if (error) {
  console.error('Resend error:', JSON.stringify(error, null, 2));
  process.exit(1);
}

console.log('OK:', JSON.stringify(data, null, 2));
