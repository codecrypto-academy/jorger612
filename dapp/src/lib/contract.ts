import { ethers } from 'ethers';
import { SECURITY_MANAGER_ABI } from './abi';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 1337);

/** Bloque de despliegue del contrato; las consultas de eventos empiezan aquí (no en 0). */
function parseDeployBlock(): number {
  const raw = process.env.NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK;
  if (raw === undefined || raw === '') return 0;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
export const CONTRACT_DEPLOY_BLOCK = parseDeployBlock();

/** Dirección del desplegador / owner esperada (misma red que MetaMask). Si coincide con la wallet, se habilita UI de owner aunque falle la lectura vía RPC público. */
const CONTRACT_OWNER_FROM_ENV = process.env.NEXT_PUBLIC_CONTRACT_OWNER_ADDRESS?.trim().toLowerCase() ?? '';

export function isConfiguredContractOwner(address: string | null | undefined): boolean {
  if (!address || !CONTRACT_OWNER_FROM_ENV) return false;
  return address.toLowerCase() === CONTRACT_OWNER_FROM_ENV;
}

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
    if (msg.includes('NoAutorizado')) return 'No tienes permiso para realizar esta accion.';
    if (msg.includes('CuentaYaExiste')) return 'La cuenta ya existe.';
    if (msg.includes('CuentaNoExiste')) return 'La cuenta no existe.';
    if (msg.includes('DireccionInvalida')) return 'Direccion invalida.';
    if (msg.includes('caller is not the owner')) return 'Solo el propietario del contrato puede realizar esta accion.';
    if (msg.includes('user rejected')) return 'Transaccion rechazada por el usuario.';
    return msg.length > 120 ? msg.substring(0, 120) + '...' : msg;
  }
  return 'Error desconocido';
}
