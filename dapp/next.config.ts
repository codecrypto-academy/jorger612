import type { NextConfig } from 'next';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  const lines = readFileSync(filePath, 'utf-8').split('\n');
  const env: Record<string, string> = {};

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

const sharedEnv = parseEnvFile(resolve(__dirname, '../.env'));
const apiLocalEnv = parseEnvFile(resolve(__dirname, '../api/.env'));
const apiDevPort = apiLocalEnv.PORT || '3005';

const apiRewriteTarget =
  process.env.API_REWRITE_TARGET ?? `http://127.0.0.1:${apiDevPort}`;

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiRewriteTarget}/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL
      ?? '/api',
    NEXT_PUBLIC_RPC_URL:
      process.env.NEXT_PUBLIC_RPC_URL
      ?? process.env.RPC_URL
      ?? sharedEnv.RPC_URL
      ?? 'http://localhost:8545',
    NEXT_PUBLIC_CHAIN_ID:
      process.env.NEXT_PUBLIC_CHAIN_ID
      ?? process.env.CHAIN_ID
      ?? sharedEnv.CHAIN_ID
      ?? '1337',
    NEXT_PUBLIC_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      ?? process.env.CONTRACT_ADDRESS
      ?? sharedEnv.CONTRACT_ADDRESS
      ?? '',
    NEXT_PUBLIC_CONTRACT_OWNER_ADDRESS:
      process.env.NEXT_PUBLIC_CONTRACT_OWNER_ADDRESS
      ?? process.env.CONTRACT_OWNER_ADDRESS
      ?? sharedEnv.CONTRACT_OWNER_ADDRESS
      ?? '',
    NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK:
      process.env.NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK
      ?? process.env.CONTRACT_DEPLOY_BLOCK
      ?? sharedEnv.CONTRACT_DEPLOY_BLOCK
      ?? '0',
    NEXT_PUBLIC_NETWORK_NAME:
      process.env.NEXT_PUBLIC_NETWORK_NAME
      ?? process.env.NETWORK_NAME
      ?? sharedEnv.NETWORK_NAME
      ?? '',
    NEXT_PUBLIC_CONTRACT_DISPLAY_NAME:
      process.env.NEXT_PUBLIC_CONTRACT_DISPLAY_NAME
      ?? process.env.CONTRACT_DISPLAY_NAME
      ?? sharedEnv.CONTRACT_DISPLAY_NAME
      ?? 'SecurityManager',
  },
};

export default nextConfig;
