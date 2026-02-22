import { ethers } from 'ethers';
import { SECURITY_MANAGER_ABI } from './abi';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);

export function getReadOnlyContract(provider?: ethers.Provider) {
  const prov = provider ?? new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, SECURITY_MANAGER_ABI, prov);
}

export function getSignedContract(signer: ethers.Signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, SECURITY_MANAGER_ABI, signer);
}

export function parseContractError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('RolNoExiste')) return 'El rol especificado no existe.';
    if (msg.includes('RolInactivo')) return 'El rol esta inactivo.';
    if (msg.includes('UsuarioNoExiste')) return 'El usuario no existe.';
    if (msg.includes('MenuNoExiste')) return 'El menu no existe.';
    if (msg.includes('MenuYaVinculado')) return 'El menu ya esta vinculado a este rol.';
    if (msg.includes('MenuNoVinculado')) return 'El menu no esta vinculado a este rol.';
    if (msg.includes('caller is not the owner')) return 'Solo el propietario del contrato puede realizar esta accion.';
    if (msg.includes('La cuenta ya existe')) return 'La cuenta ya existe.';
    if (msg.includes('La cuenta no existe')) return 'La cuenta no existe.';
    if (msg.includes('Direccion invalida')) return 'Direccion invalida.';
    if (msg.includes('user rejected')) return 'Transaccion rechazada por el usuario.';
    return msg.length > 120 ? msg.substring(0, 120) + '...' : msg;
  }
  return 'Error desconocido';
}
