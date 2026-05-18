import {
  createMarketLead,
  listMarketLeads,
  updateMarketLeadStatus,
} from '../controllers/market.controller.js';
import {
  getPasswordSetupInfo,
  completePasswordSetup,
} from '../controllers/market-password.controller.js';
import {
  getPortalAuthStatus,
  postPortalAuthLogin,
  postPortalForgotPassword,
} from '../controllers/market-portal-auth.controller.js';

export async function marketRoutes(fastify) {
  fastify.post('/market/leads', createMarketLead);
  fastify.get('/market/leads', listMarketLeads);
  fastify.patch('/market/leads/:id', updateMarketLeadStatus);
  fastify.get('/market/password-setup', getPasswordSetupInfo);
  fastify.post('/market/password-setup', completePasswordSetup);
  fastify.get('/market/portal-auth/status', getPortalAuthStatus);
  fastify.post('/market/portal-auth/login', postPortalAuthLogin);
  fastify.post('/market/portal-auth/forgot-password', postPortalForgotPassword);
}
