import Redis from 'ioredis';

let redis = null;
let redisEnabled = false;

function getRedisUrl() {
  const url = process.env.REDIS_URL?.trim();
  if (url) return url;
  return '';
}

export async function connectRedis() {
  const url = getRedisUrl();
  if (!url) {
    redisEnabled = false;
    return null;
  }

  redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  redis.on('error', () => {
    // El error queda en logs de Fastify cuando falla una operación.
  });

  await redis.connect();
  redisEnabled = true;
  return redis;
}

export function getRedis() {
  return redis;
}

export function isRedisEnabled() {
  return redisEnabled && !!redis;
}

export async function closeRedis() {
  if (!redis) return;
  try {
    await redis.quit();
  } finally {
    redis = null;
    redisEnabled = false;
  }
}
