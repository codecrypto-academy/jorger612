import Fastify from 'fastify';
import cors from '@fastify/cors';
import { permissionsRoutes } from './routes/permissions.routes.js';
import { marketRoutes } from './routes/market.routes.js';
import { connectMongo } from './db/mongo.js';

const PORT = Number(process.env.PORT) || 3005;

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

await connectMongo();

app.register(permissionsRoutes, { prefix: '/' });
app.register(marketRoutes);

app.get('/', async () => ({ ok: true, service: 'rbac-permissions-api' }));
app.get('/health', async () => ({ status: 'ok' }));

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`API RBAC corriendo en http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
