import Fastify from 'fastify';
import cors from '@fastify/cors';
import { permissionsRoutes } from './routes/permissions.routes.js';
import { marketRoutes } from './routes/market.routes.js';
import { connectMongo } from './db/mongo.js';
import { connectRedis, closeRedis, isRedisEnabled } from './services/redis.service.js';
import {
  startPermissionsIndexer,
  stopPermissionsIndexer,
  getIndexerStatus,
} from './services/permissions-index.service.js';

const PORT = Number(process.env.PORT) || 3005;

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

await connectMongo();
try {
  await connectRedis();
  await startPermissionsIndexer(app.log);
} catch (err) {
  app.log.error({ err }, 'Redis no disponible: se desactiva caché/indexador');
}

app.register(permissionsRoutes, { prefix: '/' });
app.register(marketRoutes);

app.get('/', async () => ({ ok: true, service: 'rbac-permissions-api' }));
app.get('/health', async () => {
  const indexer = await getIndexerStatus();
  return {
    status: 'ok',
    redisEnabled: isRedisEnabled(),
    indexer,
  };
});

async function onClose() {
  stopPermissionsIndexer();
  await closeRedis();
}

process.on('SIGINT', async () => {
  await onClose();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await onClose();
  process.exit(0);
});

try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`API RBAC corriendo en http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
