"use client";

import { useState } from "react";
import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import AcademicSolIDL from "@/types/academic_sol.json";
import { fetchAllCredentials } from "@/lib/solana/credentials";
import { buildCredentialJsonLdFromOnChain } from "@/lib/utils/credential";
import { JsonLdPopup } from "@/components/JsonLdPopup";
import { getIpfsUrl } from "@/lib/utils/pinata";

// Dummy wallet for read-only Program (verify doesn't need to sign)
const dummyWallet = {
  publicKey: null as any,
  signTransaction: async (tx: any) => tx,
  signAllTransactions: async (txs: any[]) => txs,
};

export default function VerifyPage() {
  const { connection } = useConnection();
  const [studentAddress, setStudentAddress] = useState("");
  const [credentialId, setCredentialId] = useState("");
  const [result, setResult] = useState<{
    status: "valid" | "revoked" | "expired" | "not_found";
    data?: {
      programName: string;
      credentialType: string;
      recipient: string;
      issueDate: string;
      issuer: string;
      credentialId: number;
      issueDateTs: number;
      issuerPubkey: string;
      documentHash: string;
      ipfsCid: string;
      certDate: string;
      certDateTs: number;
    };
    error?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showJsonPopup, setShowJsonPopup] = useState(false);

  const handleVerify = async () => {
    const id = parseInt(credentialId, 10);
    if (isNaN(id) || id < 1) {
      setResult({
        status: "not_found",
        error: "ID de certificado inválido",
      });
      return;
    }

    if (!studentAddress) {
      setResult({
        status: "not_found",
        error: "Introduce la dirección del estudiante (destinatario)",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const provider = new AnchorProvider(
        connection,
        dummyWallet as any,
        { commitment: "confirmed" }
      );
      const program = new Program(AcademicSolIDL as any, provider);

      const studentPubkey = new PublicKey(studentAddress);
      const allCredentials = await fetchAllCredentials(program as any);
      const match = allCredentials.find(
        (c) =>
          c.account.recipient.equals(studentPubkey) &&
          c.account.id.toNumber() === id
      );
      if (!match) {
        throw new Error(
          "No se encontró el certificado. Verifica que la dirección del estudiante y el ID sean correctos."
        );
      }
      const credential = match.account;
      const institution = await (program as any).account.institution.fetch(
        match.account.issuer
      );

      let status: "valid" | "revoked" | "expired" = "valid";
      const st = credential.status as { revoked?: object; expired?: object };
      if (st.revoked) status = "revoked";
      else if (
        credential.expiryDate.toNumber() > 0 &&
        credential.expiryDate.toNumber() < Math.floor(Date.now() / 1000)
      )
        status = "expired";

      const issueDateTs = credential.issueDate.toNumber();
      const certDateTs = credential.certDate?.toNumber?.() ?? 0;
      const certDateStr =
        certDateTs > 0
          ? new Date(certDateTs * 1000).toLocaleDateString("es-ES", {
              month: "long",
              year: "numeric",
            })
          : "—";
      setResult({
        status,
        data: {
          programName: credential.programName,
          credentialType: credential.credentialType,
          recipient: credential.recipient.toString(),
          issueDate: new Date(issueDateTs * 1000).toLocaleDateString(),
          issuer: institution.name,
          credentialId: credential.id.toNumber(),
          issueDateTs,
          issuerPubkey: institution.address.toString(),
          documentHash: credential.documentHash,
          ipfsCid: credential.ipfsCid?.trim() ?? "",
          certDate: certDateStr,
          certDateTs,
        },
      });
    } catch (err: any) {
      console.error(err);
      setResult({
        status: "not_found",
        error: err?.message || "No se encontró el certificado",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-black">
              ◆ Verificar Certificado
            </h1>
            <p className="text-sm text-black mt-1">
              Introduce los datos para verificar un certificado on-chain
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 border-2 border-black rounded font-bold text-black hover:bg-gray-100"
          >
            Inicio
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border-4 border-black rounded-lg p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Dirección del Estudiante (Pubkey)
              </label>
              <input
                type="text"
                value={studentAddress}
                onChange={(e) => setStudentAddress(e.target.value)}
                placeholder="Ej: 3UgMMccpqc6dafbUYbdrEizmrDACizxdEKeWe1ALXqd1"
                className="w-full px-4 py-2 border-2 border-black rounded font-mono text-sm text-black"
              />
              <p className="text-xs text-gray-600 mt-1">
                La dirección que aparece como &quot;Estudiante&quot; en el
                certificado
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                ID del Certificado
              </label>
              <input
                type="number"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full px-4 py-2 border-2 border-black rounded text-black"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-black text-white font-black py-4 rounded-lg border-4 border-black hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
          </div>

          {result && (
            <div className="mt-8 p-6 border-4 border-black rounded-lg">
              {result.error ? (
                <p className="text-red-600 font-bold">{result.error}</p>
              ) : (
                <>
                  <div
                    className={`text-2xl font-black mb-4 ${
                      result.status === "valid"
                        ? "text-green-600"
                        : result.status === "revoked"
                        ? "text-red-600"
                        : result.status === "expired"
                        ? "text-orange-600"
                        : "text-black"
                    }`}
                  >
                    {result.status === "valid" && "✓ Certificado VÁLIDO"}
                    {result.status === "revoked" && "✗ Certificado REVOCADO"}
                    {result.status === "expired" && "⚠ Certificado EXPIRADO"}
                  </div>
                  {result.data && (
                    <>
                      {result.data.ipfsCid && (
                        <div className="mb-4">
                          <img
                            src={getIpfsUrl(result.data.ipfsCid)}
                            alt="Certificado"
                            className="w-[120px] h-auto object-cover rounded-lg cursor-pointer border-2 border-black"
                            onClick={() =>
                              window.open(
                                getIpfsUrl(result.data!.ipfsCid),
                                "_blank"
                              )
                            }
                          />
                        </div>
                      )}
                      <div className="space-y-2 text-black">
                        <p>
                          <span className="font-bold">Programa:</span>{" "}
                          {result.data.programName}
                        </p>
                        <p>
                          <span className="font-bold">Tipo:</span>{" "}
                          {result.data.credentialType}
                        </p>
                        <p>
                          <span className="font-bold">Emisor:</span>{" "}
                          {result.data.issuer}
                        </p>
                        <p>
                          <span className="font-bold">Fecha emisión:</span>{" "}
                          {result.data.issueDate}
                        </p>
                        <p>
                          <span className="font-bold">Fecha certificado:</span>{" "}
                          {result.data.certDate}
                        </p>
                        <p className="font-mono text-xs break-all">
                          <span className="font-bold">Destinatario:</span>{" "}
                          {result.data.recipient}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowJsonPopup(true)}
                        className="mt-4 w-full rounded border-2 border-black bg-gray-100 px-4 py-2 font-bold text-black hover:bg-gray-200"
                      >
                        Ver JSON-LD
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {showJsonPopup && result?.data && (
        <JsonLdPopup
          json={buildCredentialJsonLdFromOnChain(
            result.data.credentialId,
            result.data.programName,
            result.data.credentialType,
            result.data.recipient,
            result.data.issueDateTs,
            result.data.issuer,
            result.data.issuerPubkey,
            result.data.documentHash,
            result.data.certDateTs
          )}
          onClose={() => setShowJsonPopup(false)}
        />
      )}
    </div>
  );
}
