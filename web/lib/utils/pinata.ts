/**
 * Upload file to IPFS via Pinata
 * Uses NEXT_PUBLIC_ env vars for client-side (Next.js)
 */
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
export const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export async function uploadToPinata(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error(
      "Faltan credenciales de Pinata. Configura NEXT_PUBLIC_PINATA_API_KEY y NEXT_PUBLIC_PINATA_SECRET_KEY en .env.local"
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(PINATA_API_URL, {
    method: "POST",
    headers: {
      pinata_api_key: apiKey,
      pinata_secret_api_key: secretKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error al subir a Pinata: ${err}`);
  }

  const result = (await response.json()) as { IpfsHash?: string };
  if (!result.IpfsHash) {
    throw new Error("Pinata no retornó un CID válido");
  }

  return result.IpfsHash;
}

export function getIpfsUrl(cid: string): string {
  if (!cid || cid.trim() === "") return "";
  return `${PINATA_GATEWAY}${cid}`;
}
