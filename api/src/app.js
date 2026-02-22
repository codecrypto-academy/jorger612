import Fastify from 'fastify';
import cors from '@fastify/cors';
import { permissionsRoutes } from './routes/permissions.routes.js';

const PORT = Number(process.env.PORT) || 3001;

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

app.register(permissionsRoutes, { prefix: '/' });

app.get('/', async () => ({ ok: true, service: 'rbac-permissions-api' }));
app.get('/health', async () => ({ status: 'ok' }));

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`API RBAC corriendo en http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
