"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useDashboardRole } from "@/lib/hooks/useDashboardRole";
import { PublicKey } from "@solana/web3.js";
import { buildCredentialJsonLdFromOnChain } from "@/lib/utils/credential";
import { JsonLdPopup } from "@/components/JsonLdPopup";
import { getIpfsUrl } from "@/lib/utils/pinata";
import { fetchAllCredentials } from "@/lib/solana/credentials";

interface CredentialInfo {
  id: number;
  programName: string;
  credentialType: string;
  issuer: string;
  issueDate: string;
  status: string;
  recipient: string;
  issueDateTs: number;
  issuerPubkey: string;
  documentHash: string;
  ipfsCid: string;
  certDate: string;
  certDateTs: number;
}

export default function StudentPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { canSeeMyCertificates, loading: roleLoading } = useDashboardRole();
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [jsonPopupCredential, setJsonPopupCredential] =
    useState<CredentialInfo | null>(null);

  useEffect(() => {
    if (!publicKey) {
      router.push("/");
      return;
    }
    if (!roleLoading && !canSeeMyCertificates) {
      router.push("/dashboard");
      return;
    }
  }, [publicKey, router, roleLoading, canSeeMyCertificates]);

  useEffect(() => {
    if (!program || !publicKey || !canSeeMyCertificates) {
      setLoading(false);
      return;
    }

    const fetchCredentials = async () => {
      try {
        const allCredentials = await fetchAllCredentials(program);
        const mine = allCredentials.filter(
          (c) => c.account.recipient.toString() === publicKey.toString()
        );

        const withInstitution = await Promise.all(
          mine.map(async (c) => {
            const issuerPda = c.account.issuer;
            const institution = await program.account.institution.fetch(
              issuerPda
            );
            let status = "Válido";
            const st = c.account.status as { revoked?: object; expired?: object };
            if (st.revoked) status = "Revocado";
            else if (st.expired) status = "Expirado";

            const issueDateTs = c.account.issueDate.toNumber();
            const certDateTs = c.account.certDate?.toNumber?.() ?? 0;
            const certDateStr =
              certDateTs > 0
                ? new Date(certDateTs * 1000).toLocaleDateString("es-ES", {
                    month: "long",
                    year: "numeric",
                  })
                : "—";
            const ipfsCid =
              ((c.account as { ipfsCid?: string }).ipfsCid ??
                (c.account as { ipfs_cid?: string }).ipfs_cid ??
                ""
              ).trim();
            return {
              id: c.account.id.toNumber(),
              programName: c.account.programName,
              credentialType: c.account.credentialType,
              issuer: institution.name,
              issueDate: new Date(issueDateTs * 1000).toLocaleDateString(),
              status,
              recipient: c.account.recipient.toString(),
              issueDateTs,
              issuerPubkey: institution.address.toString(),
              documentHash: c.account.documentHash,
              ipfsCid,
              certDate: certDateStr,
              certDateTs,
            };
          })
        );

        setCredentials(withInstitution);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [program, publicKey, canSeeMyCertificates]);

  if (roleLoading || !canSeeMyCertificates) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-black">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-black text-black">Mis Certificados</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 border-2 border-black rounded font-bold text-black"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-black">Cargando certificados...</p>
        ) : credentials.length === 0 ? (
          <p className="text-black">
            No tienes certificados emitidos a tu dirección.
          </p>
        ) : (
          <div className="space-y-4">
            {credentials.map((c) => (
              <div
                key={c.id}
                className="p-6 border-4 border-black rounded-lg hover:bg-gray-50 flex gap-4"
              >
                <div className="flex-shrink-0">
                  {c.ipfsCid ? (
                    <img
                      src={getIpfsUrl(c.ipfsCid)}
                      alt="Certificado"
                      className="w-[120px] h-auto object-cover rounded-lg cursor-pointer border-2 border-black"
                      onClick={() =>
                        window.open(getIpfsUrl(c.ipfsCid), "_blank")
                      }
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (
                          (e.target as HTMLImageElement)
                            .nextElementSibling as HTMLElement
                        )?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-[120px] h-[80px] bg-gray-100 rounded-lg flex items-center justify-center text-2xl border-2 border-black ${
                      c.ipfsCid ? "hidden" : ""
                    }`}
                  >
                    📜
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-black">{c.programName}</h3>
                    <p className="text-black">
                      {c.credentialType} · {c.issuer}
                    </p>
                    <p className="text-sm text-black mt-1">
                      Emitido: {c.issueDate} · Cert: {c.certDate} · ID: {c.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setJsonPopupCredential(c)}
                      className="rounded border-2 border-black px-3 py-1 text-sm font-bold text-black hover:bg-gray-100"
                    >
                      Ver JSON
                    </button>
                    <span
                      className={`px-3 py-1 rounded font-bold text-black ${
                        c.status === "Válido"
                          ? "bg-green-100"
                          : c.status === "Revocado"
                          ? "bg-red-100"
                          : "bg-orange-100"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {jsonPopupCredential && (
        <JsonLdPopup
          json={buildCredentialJsonLdFromOnChain(
            jsonPopupCredential.id,
            jsonPopupCredential.programName,
            jsonPopupCredential.credentialType,
            jsonPopupCredential.recipient,
            jsonPopupCredential.issueDateTs,
            jsonPopupCredential.issuer,
            jsonPopupCredential.issuerPubkey,
            jsonPopupCredential.documentHash,
            jsonPopupCredential.certDateTs
          )}
          onClose={() => setJsonPopupCredential(null)}
        />
      )}
    </div>
  );
}
