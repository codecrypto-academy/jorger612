import { ethers } from 'ethers';
import { getContract } from '../config/blockchain.js';

/**
 * Comprueba que la dirección coincida con contract.owner().
 * @returns {Promise<string>} dirección checksummed
 */
export async function assertContractOwner(addressRaw) {
  if (!addressRaw || typeof addressRaw !== 'string') {
    const err = new Error('Falta la dirección del owner.');
    err.code = 'MISSING_ADDRESS';
    throw err;
  }
  let address;
  try {
    address = ethers.getAddress(addressRaw.trim());
  } catch {
    const err = new Error('Dirección no válida.');
    err.code = 'INVALID_ADDRESS';
    throw err;
  }
  const contract = getContract();
  const owner = await contract.owner();
  if (owner.toLowerCase() === address.toLowerCase()) {
    return address;
  }

  const envOwner = process.env.CONTRACT_OWNER_ADDRESS?.trim();
  if (envOwner) {
    try {
      const configured = ethers.getAddress(envOwner);
      if (configured.toLowerCase() === address.toLowerCase()) {
        return address;
      }
    } catch {
      /* ignore */
    }
  }

  const err = new Error('Solo el owner del contrato puede realizar esta acción.');
  err.code = 'NOT_OWNER';
  throw err;
}
