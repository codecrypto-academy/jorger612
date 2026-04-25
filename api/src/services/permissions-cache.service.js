import { ethers } from 'ethers';
import { CHAIN_ID, getContract, getProvider } from '../config/blockchain.js';
import { getRedis, isRedisEnabled } from './redis.service.js';

const CACHE_PREFIX = 'rbac:perm-cache:v1';
const SAFE_CONFIRMATIONS = Number(process.env.PERM_CACHE_CONFIRMATIONS ?? 6);
const CACHE_TTL_SECONDS = Number(process.env.PERM_CACHE_TTL_SECONDS ?? 30);
const CACHE_ERROR_TTL_SECONDS = Number(process.env.PERM_CACHE_ERROR_TTL_SECONDS ?? 10);

function normAddress(address) {
  try {
    return ethers.getAddress(String(address || '').trim()).toLowerCase();
  } catch {
    return String(address || '').trim().toLowerCase();
  }
}

function normLogin(login) {
  return String(login || '').trim().toLowerCase();
}

function buildCacheKey({ address, login, safeBlock }) {
  const contract = getContract();
  const contractAddress = String(contract.target || '').toLowerCase();
  return [
    CACHE_PREFIX,
    CHAIN_ID,
    contractAddress,
    normAddress(address),
    normLogin(login),
    `b${safeBlock}`,
  ].join(':');
}

export async function getSafeBlock() {
  const latest = await getProvider().getBlockNumber();
  return Math.max(0, latest - SAFE_CONFIRMATIONS);
}

export async function getCachedPermissionsTree(address, login, safeBlock) {
  if (!isRedisEnabled()) return null;
  const redis = getRedis();
  const key = buildCacheKey({ address, login, safeBlock });
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function cachePermissionsTree(address, login, safeBlock, payload) {
  if (!isRedisEnabled()) return;
  const redis = getRedis();
  const key = buildCacheKey({ address, login, safeBlock });
  const ttl = payload?.error ? CACHE_ERROR_TTL_SECONDS : CACHE_TTL_SECONDS;
  await redis.set(key, JSON.stringify(payload), 'EX', ttl);
}
