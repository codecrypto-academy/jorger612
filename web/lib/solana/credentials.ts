import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { AcademicSol } from "@/types/academic_sol";

/** Discriminador de la cuenta Credential (primeros 8 bytes del hash) */
const CREDENTIAL_DISCRIMINATOR = Buffer.from([
  145, 44, 68, 220, 67, 46, 100, 135,
]);

/** Credential parseada (formato compatible con el frontend) */
export interface ParsedCredential {
  publicKey: PublicKey;
  account: {
    id: { toNumber: () => number };
    issuer: PublicKey;
    recipient: PublicKey;
    credentialType: string;
    programName: string;
    issueDate: { toNumber: () => number };
    expiryDate: { toNumber: () => number };
    certDate: { toNumber: () => number };
    documentHash: string;
    ipfsCid: string;
    status: { valid?: object } | { revoked?: object } | { expired?: object };
    publicKeyIssuer: string;
    bump: number;
  };
}

/** Normaliza una cuenta decodificada por Anchor (snake_case) al formato esperado */
function normalizeDecodedAccount(decoded: Record<string, unknown>): ParsedCredential["account"] {
  const getStr = (k: string) => (decoded[k] as string) ?? "";
  const getNum = (k: string) => {
    const v = decoded[k];
    if (typeof v === "object" && v !== null && "toNumber" in v)
      return (v as { toNumber: () => number }).toNumber();
    return Number(v ?? 0);
  };
  return {
    id: { toNumber: () => getNum("id") },
    issuer: decoded.issuer as PublicKey,
    recipient: decoded.recipient as PublicKey,
    credentialType: getStr("credential_type") || getStr("credentialType"),
    programName: getStr("program_name") || getStr("programName"),
    issueDate: { toNumber: () => getNum("issue_date") || getNum("issueDate") },
    expiryDate: { toNumber: () => getNum("expiry_date") || getNum("expiryDate") },
    certDate: { toNumber: () => getNum("cert_date") || getNum("certDate") || 0 },
    documentHash: getStr("document_hash") || getStr("documentHash"),
    ipfsCid: (getStr("ipfs_cid") || getStr("ipfsCid") || "").trim(),
    status: decoded.status as ParsedCredential["account"]["status"],
    publicKeyIssuer: getStr("public_key_issuer") || getStr("publicKeyIssuer"),
    bump: (decoded.bump as number) ?? 0,
  };
}

function readString(buffer: Buffer, offset: { value: number }): string {
  const len = buffer.readUInt32LE(offset.value);
  offset.value += 4;
  const str = buffer.subarray(offset.value, offset.value + len).toString("utf8");
  offset.value += len;
  return str;
}

/**
 * Parsea una credencial en formato antiguo (sin ipfs_cid).
 * Usado cuando la cuenta fue creada antes de añadir el campo ipfs_cid.
 */
function parseLegacyCredential(
  data: Buffer,
  publicKey: PublicKey
): ParsedCredential {
  const offset = { value: 8 }; // Saltar discriminador

  const id = data.readBigUInt64LE(offset.value);
  offset.value += 8;
  const issuer = new PublicKey(data.subarray(offset.value, offset.value + 32));
  offset.value += 32;
  const recipient = new PublicKey(data.subarray(offset.value, offset.value + 32));
  offset.value += 32;
  const credentialType = readString(data, offset);
  const programName = readString(data, offset);
  const issueDate = data.readBigInt64LE(offset.value);
  offset.value += 8;
  const expiryDate = data.readBigInt64LE(offset.value);
  offset.value += 8;
  const documentHash = readString(data, offset);
  // Formato antiguo: no tiene ipfs_cid ni cert_date, va directo a status
  const statusVal = data.readUInt32LE(offset.value);
  offset.value += 4;
  const publicKeyIssuer = readString(data, offset);
  const bump = data.readUInt8(offset.value);

  const status =
    statusVal === 0
      ? { valid: {} }
      : statusVal === 1
        ? { revoked: {} }
        : { expired: {} };

  return {
    publicKey,
    account: {
      id: { toNumber: () => Number(id) },
      issuer,
      recipient,
      credentialType,
      programName,
      issueDate: { toNumber: () => Number(issueDate) },
      expiryDate: { toNumber: () => Number(expiryDate) },
      certDate: { toNumber: () => 0 },
      documentHash,
      ipfsCid: "",
      status,
      publicKeyIssuer,
      bump,
    },
  };
}

function isCredentialAccount(data: Buffer): boolean {
  if (data.length < 8) return false;
  return data.subarray(0, 8).equals(CREDENTIAL_DISCRIMINATOR);
}

/**
 * Obtiene todas las credenciales del programa, soportando tanto el formato
 * nuevo (con ipfs_cid) como el antiguo (sin ipfs_cid).
 * Evita el RangeError al deserializar cuentas creadas antes de añadir ipfs_cid.
 */
export async function fetchAllCredentials(
  program: Program<AcademicSol>
): Promise<ParsedCredential[]> {
  const connection = program.provider.connection;
  const programId = program.programId;

  const accounts = await connection.getProgramAccounts(programId);
  const credentialAccounts = accounts.filter((a) =>
    isCredentialAccount(Buffer.from(a.account.data))
  );

  const result: ParsedCredential[] = [];

  for (const { pubkey, account } of credentialAccounts) {
    const data = Buffer.from(account.data);
    try {
      const decoded = program.coder.accounts.decode("credential", data) as Record<string, unknown>;
      result.push({
        publicKey: pubkey,
        account: normalizeDecodedAccount(decoded),
      });
    } catch {
      try {
        result.push(parseLegacyCredential(data, pubkey));
      } catch (e) {
        console.warn("No se pudo parsear credencial:", pubkey.toString(), e);
      }
    }
  }

  return result;
}

/**
 * Obtiene una credencial por su dirección (PDA).
 * Soporta formato nuevo y legacy.
 */
export async function fetchCredential(
  program: Program<AcademicSol>,
  credentialPda: PublicKey
): Promise<ParsedCredential["account"] | null> {
  const connection = program.provider.connection;
  const accountInfo = await connection.getAccountInfo(credentialPda);
  if (!accountInfo || !accountInfo.data) return null;
  const data = Buffer.from(accountInfo.data);
  if (!isCredentialAccount(data)) return null;
  try {
    const decoded = program.coder.accounts.decode("credential", data) as Record<string, unknown>;
    return normalizeDecodedAccount(decoded);
  } catch {
    try {
      return parseLegacyCredential(data, credentialPda).account;
    } catch {
      return null;
    }
  }
}
