import {
  createMarketLead,
  listMarketLeads,
  updateMarketLeadStatus,
} from '../controllers/market.controller.js';

export async function marketRoutes(fastify) {
  fastify.post('/market/leads', createMarketLead);
  fastify.get('/market/leads', listMarketLeads);
  fastify.patch('/market/leads/:id', updateMarketLeadStatus);
}
