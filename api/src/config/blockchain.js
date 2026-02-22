import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

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
