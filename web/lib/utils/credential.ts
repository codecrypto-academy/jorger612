/**
 * Generate SHA256 hash of a string (for document_hash)
 */
export async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = new Uint8Array(encoder.encode(data));
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create JSON-LD credential document (Open Badges format)
 */
export interface CredentialJsonLd {
  "@context": string;
  type: string;
  id: string;
  recipient: { type: string; identity: string };
  badge: {
    name: string;
    description: string;
    issuer: { name: string; id: string };
  };
  certDate?: string;
  issuedOn: string;
  verification: { type: string; publicKey: string };
}

export function createCredentialJsonLd(
  credentialId: number,
  programName: string,
  recipientEmail: string,
  recipientWallet: string,
  institutionName: string,
  institutionPubkey: string,
  issuedOn: string,
  certDate?: string
): CredentialJsonLd {
  const identity = recipientEmail || recipientWallet;
  const identityType = recipientEmail ? "email" : "wallet";
  const result: CredentialJsonLd = {
    "@context": "https://w3id.org/openbadges/v2",
    type: "Assertion",
    id: `solana:credential-${credentialId}`,
    recipient: {
      type: identityType,
      identity,
    },
    badge: {
      name: programName,
      description: `Completó exitosamente el programa de ${programName}`,
      issuer: {
        name: institutionName,
        id: institutionPubkey,
      },
    },
    ...(certDate && { certDate }),
    issuedOn,
    verification: {
      type: "SolanaSignature",
      publicKey: institutionPubkey,
    },
  };
  return result;
}

/**
 * Build JSON-LD from on-chain credential data (for display/verification)
 */
export function buildCredentialJsonLdFromOnChain(
  credentialId: number,
  programName: string,
  credentialType: string,
  recipient: string,
  issueDate: number,
  issuerName: string,
  issuerPubkey: string,
  _documentHash?: string,
  certDateTs?: number
): CredentialJsonLd {
  const issuedOn = new Date(issueDate * 1000).toISOString();
  const certDate =
    certDateTs && certDateTs > 0
      ? new Date(certDateTs * 1000).toISOString()
      : undefined;
  return {
    "@context": "https://w3id.org/openbadges/v2",
    type: "Assertion",
    id: `solana:credential-${credentialId}`,
    recipient: {
      type: "wallet",
      identity: recipient,
    },
    badge: {
      name: programName,
      description: `Credencial ${credentialType}: ${programName}`,
      issuer: {
        name: issuerName,
        id: issuerPubkey,
      },
    },
    ...(certDate && { certDate }),
    issuedOn,
    verification: {
      type: "SolanaSignature",
      publicKey: issuerPubkey,
    },
  };
}
