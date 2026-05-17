import { MongoClient } from 'mongodb';

/** @type {MongoClient | null} */
let client = null;
/** @type {import('mongodb').Db | null} */
let db = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Conecta a MongoDB (URI con nombre de base, ej. mongodb://host:27017/rbac_market).
 * Reintenta para dar tiempo a que el contenedor mongo esté listo en Docker.
 */
export async function connectMongo(retries = 12, delayMs = 2500) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI no definido');
  }
  let lastErr;
  for (let i = 0; i < retries; i += 1) {
    try {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db();
      const leads = db.collection('market_leads');
      await leads.createIndex({ createdAt: -1 });
      await leads.createIndex(
        { passwordSetupTokenHash: 1 },
        { unique: true, sparse: true },
      );
      await leads.createIndex({ walletAddress: 1 });
      return db;
    } catch (err) {
      lastErr = err;
      if (client) {
        try {
          await client.close();
        } catch {
          /* ignore */
        }
        client = null;
        db = null;
      }
      await sleep(delayMs);
    }
  }
  throw lastErr;
}

export function getDb() {
  if (!db) throw new Error('MongoDB no conectado');
  return db;
}

export function getMarketLeadsCollection() {
  return getDb().collection('market_leads');
}
