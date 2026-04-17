import { ethers } from 'ethers';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  const lines = readFileSync(filePath, 'utf-8').split('\n');
  const env = {};
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

const sharedEnv = parseEnvFile(join(__dirname, '../../../.env'));
const envOrShared = (key, fallback = '') => process.env[key] ?? sharedEnv[key] ?? fallback;

const RPC_URL = envOrShared('RPC_URL', 'http://localhost:8545');
const CONTRACT_ADDRESS = envOrShared('CONTRACT_ADDRESS', '');
export const CHAIN_ID = Number(envOrShared('CHAIN_ID', '31337'));

const abiPath = join(__dirname, '../abis/SecurityManager.json');
const abi = JSON.parse(readFileSync(abiPath, 'utf-8'));

export function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

export function getContract() {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
}

export const ZERO_ADDRESS = ethers.ZeroAddress;
