import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "@/lib/solana/constants";

/**
 * Get the ProgramConfig PDA
 */
export function getConfigPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

/**
 * Get the Institution PDA for an address
 */
export function getInstitutionPDA(address: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("institution"), address.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Get the Credential PDA for an institution and credential ID
 */
export function getCredentialPDA(
  institution: PublicKey,
  credentialId: number
): [PublicKey, number] {
  const idBytes = new Uint8Array(8);
  const n = BigInt(credentialId);
  for (let i = 0; i < 8; i++) {
    idBytes[i] = Number((n >> BigInt(i * 8)) & BigInt(0xff));
  }
  const idBuffer = Buffer.from(idBytes);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("credential"), institution.toBuffer(), idBuffer],
    PROGRAM_ID
  );
}

/**
 * Get the CredentialCounter PDA for an institution
 */
export function getCredentialCounterPDA(
  institution: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("credential_counter"), institution.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Get the RevocationList PDA for an institution
 */
export function getRevocationListPDA(
  institution: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("revocation_list"), institution.toBuffer()],
    PROGRAM_ID
  );
}
