import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import {
  getConfigPDA,
  getInstitutionPDA,
  getCredentialPDA,
  getCredentialCounterPDA,
  getRevocationListPDA,
} from "@/lib/utils/pda";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AcademicSolProgram = Program<any>;

/**
 * Initialize the program (authority only)
 */
export async function initializeProgram(
  program: AcademicSolProgram,
  authority: PublicKey
): Promise<string> {
  const [configPDA] = getConfigPDA();

  // @ts-expect-error - Anchor IDL type inference can be excessively deep
  const tx = await program.methods
    .initialize()
    .accounts({
      programConfig: configPDA,
      authority: authority,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return tx;
}

/**
 * Register an institution (solo el authority firma; institution_address es un valor)
 */
export async function registerInstitution(
  program: AcademicSolProgram,
  authority: PublicKey,
  institutionAddress: PublicKey,
  name: string,
  location: string,
  publicKey: string
): Promise<string> {
  const [institutionPDA] = getInstitutionPDA(institutionAddress);
  const [credentialCounterPDA] = getCredentialCounterPDA(institutionAddress);
  const [revocationListPDA] = getRevocationListPDA(institutionAddress);
  const [configPDA] = getConfigPDA();

  const tx = await program.methods
    .registerInstitution(name, location, publicKey)
    .accounts({
      institution: institutionPDA,
      credentialCounter: credentialCounterPDA,
      revocationList: revocationListPDA,
      programConfig: configPDA,
      authority: authority,
      institutionAddress: institutionAddress,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return tx;
}

/**
 * Issue a credential
 */
export async function issueCredential(
  program: AcademicSolProgram,
  institutionAddress: PublicKey,
  recipient: PublicKey,
  credentialType: string,
  programName: string,
  documentHash: string,
  ipfsCid: string,
  expiryDate: number,
  certDate: number
): Promise<string> {
  const [institutionPDA] = getInstitutionPDA(institutionAddress);
  const [credentialCounterPDA] = getCredentialCounterPDA(institutionAddress);

  const counter = await (program.account as any).credentialCounter.fetch(
    credentialCounterPDA
  );
  const nextId = counter.nextId.toNumber();
  const [credentialPDA] = getCredentialPDA(institutionPDA, nextId);

  const tx = await program.methods
    .issueCredential(
      credentialType,
      programName,
      documentHash,
      ipfsCid,
      new BN(expiryDate),
      new BN(certDate)
    )
    .accounts({
      credential: credentialPDA,
      institution: institutionPDA,
      credentialCounter: credentialCounterPDA,
      recipient: recipient,
      institutionSigner: institutionAddress,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return tx;
}

/**
 * Revoke a credential
 */
export async function revokeCredential(
  program: AcademicSolProgram,
  institutionAddress: PublicKey,
  credentialId: number,
  reason: string
): Promise<string> {
  const [institutionPDA] = getInstitutionPDA(institutionAddress);
  const [credentialPDA] = getCredentialPDA(institutionPDA, credentialId);
  const [revocationListPDA] = getRevocationListPDA(institutionAddress);

  const tx = await program.methods
    .revokeCredential(reason)
    .accounts({
      credential: credentialPDA,
      institution: institutionPDA,
      revocationList: revocationListPDA,
      institutionSigner: institutionAddress,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return tx;
}

/**
 * Reissue a credential (creates new version)
 */
export async function reissueCredential(
  program: AcademicSolProgram,
  institutionAddress: PublicKey,
  oldCredentialId: number,
  recipient: PublicKey,
  credentialType: string,
  programName: string,
  documentHash: string,
  ipfsCid: string,
  expiryDate: number,
  certDate: number
): Promise<string> {
  const [institutionPDA] = getInstitutionPDA(institutionAddress);
  const [oldCredentialPDA] = getCredentialPDA(institutionPDA, oldCredentialId);
  const [credentialCounterPDA] = getCredentialCounterPDA(institutionAddress);

  const counter = await (program.account as any).credentialCounter.fetch(
    credentialCounterPDA
  );
  const nextId = counter.nextId.toNumber();
  const [newCredentialPDA] = getCredentialPDA(institutionPDA, nextId);

  const tx = await program.methods
    .reissueCredential(
      credentialType,
      programName,
      documentHash,
      ipfsCid,
      new BN(expiryDate),
      new BN(certDate)
    )
    .accounts({
      credential: newCredentialPDA,
      oldCredential: oldCredentialPDA,
      institution: institutionPDA,
      credentialCounter: credentialCounterPDA,
      recipient: recipient,
      institutionSigner: institutionAddress,
      systemProgram: SystemProgram.programId,
    } as any)
    .rpc();

  return tx;
}
