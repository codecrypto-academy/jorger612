"use client";

import { useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useDashboardRole } from "@/lib/hooks/useDashboardRole";
import {
  initializeProgram,
  registerInstitution,
  issueCredential,
  revokeCredential,
} from "@/lib/solana/instructions";
import { getInstitutionPDA, getCredentialCounterPDA } from "@/lib/utils/pda";
import { sha256Hash, createCredentialJsonLd } from "@/lib/utils/credential";
import { uploadToPinata } from "@/lib/utils/pinata";

export default function InstitutionPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const {
    canInitialize,
    canRegisterInstitution,
    canCertify,
    isProgramInitialized,
    loading: roleLoading,
  } = useDashboardRole();

  useEffect(() => {
    if (!publicKey) {
      router.push("/");
      return;
    }
    if (!roleLoading && !canCertify) {
      router.push("/dashboard");
    }
  }, [publicKey, router, roleLoading, canCertify]);

  useEffect(() => {
    if (publicKey) {
      setInstitutionPublicKey(publicKey.toString());
    }
  }, [publicKey]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [institutionName, setInstitutionName] = useState("Mi Universidad");
  const [institutionLocation, setInstitutionLocation] = useState("Madrid, España");
  const [institutionPublicKey, setInstitutionPublicKey] = useState("");
  const [recipient, setRecipient] = useState("");
  const [programName, setProgramName] = useState("");
  const [credentialType, setCredentialType] = useState("Diploma");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [credentialToRevoke, setCredentialToRevoke] = useState("");
  const [credentialImage, setCredentialImage] = useState<File | null>(null);
  const now = new Date();
  const [certMonth, setCertMonth] = useState(String(now.getMonth() + 1));
  const [certYear, setCertYear] = useState(String(now.getFullYear()));

  const handleInitialize = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    setMessage("");
    try {
      const tx = await initializeProgram(program, publicKey);
      setMessage(`Programa inicializado: ${tx}`);
    } catch (err: any) {
      setMessage(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterInstitution = async () => {
    if (!program || !publicKey) return;
    if (!institutionName.trim() || !institutionLocation.trim() || !institutionPublicKey.trim()) {
      setMessage("Complete todos los campos del formulario.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { PublicKey } = await import("@solana/web3.js");
      const institutionAddress = new PublicKey(institutionPublicKey.trim());
      const tx = await registerInstitution(
        program,
        publicKey,
        institutionAddress,
        institutionName.trim(),
        institutionLocation.trim(),
        institutionPublicKey.trim()
      );
      setMessage(`Institución registrada: ${tx}`);
    } catch (err: any) {
      setMessage(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCredential = async () => {
    if (!program || !publicKey || !recipient) return;
    setLoading(true);
    setMessage("");
    try {
      const recipientPubkey = new (await import("@solana/web3.js")).PublicKey(
        recipient
      );
      const [institutionPDA] = getInstitutionPDA(publicKey);
      const [credentialCounterPDA] = getCredentialCounterPDA(publicKey);
      const institution = await program.account.institution.fetch(
        institutionPDA
      );
      const counter = await program.account.credentialCounter.fetch(
        credentialCounterPDA
      );
      const nextId = counter.nextId.toNumber();
      const issuedOn = new Date().toISOString();
      const certDateIso = new Date(
        parseInt(certYear, 10),
        parseInt(certMonth, 10) - 1,
        1
      ).toISOString();
      const jsonLd = createCredentialJsonLd(
        nextId,
        programName,
        recipientEmail,
        recipient,
        institution.name,
        publicKey.toString(),
        issuedOn,
        certDateIso
      );
      const documentHash = await sha256Hash(JSON.stringify(jsonLd));

      let ipfsCid = "";
      if (credentialImage) {
        ipfsCid = await uploadToPinata(credentialImage);
      }

      const certDate = Math.floor(
        new Date(parseInt(certYear, 10), parseInt(certMonth, 10) - 1, 1).getTime() / 1000
      );

      const tx = await issueCredential(
        program,
        publicKey,
        recipientPubkey,
        credentialType,
        programName,
        documentHash,
        ipfsCid,
        0,
        certDate
      );
      setMessage(`Certificado emitido: ${tx}`);
    } catch (err: any) {
      setMessage(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeCredential = async () => {
    if (!program || !publicKey || !credentialToRevoke) return;
    setLoading(true);
    setMessage("");
    try {
      const id = parseInt(credentialToRevoke, 10);
      const tx = await revokeCredential(
        program,
        publicKey,
        id,
        "Revocación solicitada"
      );
      setMessage(`Certificado revocado: ${tx}`);
    } catch (err: any) {
      setMessage(`Error: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading || !canCertify) {
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
          <h1 className="text-2xl font-black text-black">Panel Institución</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 border-2 border-black rounded font-bold text-black"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {message && (
          <div className="p-4 bg-gray-100 border-2 border-black rounded text-black break-all">
            {message}
          </div>
        )}

        {canInitialize && (
          <section className="border-4 border-black rounded-lg p-6">
            <h2 className="text-xl font-black mb-4 text-black">1. Inicializar (Authority)</h2>
            <button
              onClick={handleInitialize}
              disabled={loading || isProgramInitialized}
              className="w-full px-6 py-3 bg-black text-white font-bold rounded disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-600 text-left"
            >
              {isProgramInitialized ? (
                "El programa ya fue iniciado. Si desea iniciarlo nuevamente comuníquese con el departamento de tecnología."
              ) : (
                "Inicializar Programa"
              )}
            </button>
          </section>
        )}

        {canRegisterInstitution && (
          <section className="border-4 border-black rounded-lg p-6">
            <h2 className="text-xl font-black mb-4 text-black">2. Registrar Institución</h2>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Nombre de la institución (máx. 64 caracteres)
                </label>
                <input
                  type="text"
                  placeholder="Mi Universidad"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value.slice(0, 64))}
                  maxLength={64}
                  className="w-full px-3 py-2 border-2 border-black rounded text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Ubicación (máx. 64 caracteres)
                </label>
                <input
                  type="text"
                  placeholder="Madrid, España"
                  value={institutionLocation}
                  onChange={(e) => setInstitutionLocation(e.target.value.slice(0, 64))}
                  maxLength={64}
                  className="w-full px-3 py-2 border-2 border-black rounded text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Dirección de la wallet (máx. 88 caracteres)
                </label>
                <input
                  type="text"
                  placeholder="Dirección base58 de la wallet"
                  value={institutionPublicKey}
                  onChange={(e) => setInstitutionPublicKey(e.target.value.slice(0, 88))}
                  maxLength={88}
                  className="w-full px-3 py-2 border-2 border-black rounded font-mono text-sm text-black"
                />
              </div>
            </div>
            <button
              onClick={handleRegisterInstitution}
              disabled={loading}
              className="px-6 py-2 bg-black text-white font-bold rounded disabled:opacity-50"
            >
              Registrar Institución
            </button>
          </section>
        )}

        <section className="border-4 border-black rounded-lg p-6">
          <h2 className="text-xl font-black mb-4 text-black">3. Emitir Certificado</h2>
          <div className="space-y-3 mb-4">
            <input
              type="text"
              placeholder="Dirección del estudiante (recipient)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded font-mono text-sm text-black"
            />
            <input
              type="text"
              placeholder="Email del estudiante"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded text-black"
            />
            <input
              type="text"
              placeholder="Nombre del programa (ej: Máster en Blockchain)"
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded text-black"
            />
            <select
              value={credentialType}
              onChange={(e) => setCredentialType(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded text-black"
            >
              <option value="Diploma">Diploma</option>
              <option value="Certificate">Certificate</option>
              <option value="Badge">Badge</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Mes del certificado
                </label>
                <select
                  value={certMonth}
                  onChange={(e) => setCertMonth(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded text-black"
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Año del certificado
                </label>
                <select
                  value={certYear}
                  onChange={(e) => setCertYear(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded text-black"
                >
                  {Array.from({ length: 15 }, (_, i) => 2015 + i).map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                Imagen del certificado (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCredentialImage(e.target.files?.[0] ?? null)
                }
                className="w-full px-3 py-2 border-2 border-black rounded text-black file:mr-2 file:py-1 file:px-3 file:rounded file:border-2 file:border-black file:bg-white file:text-black file:font-bold"
              />
            </div>
          </div>
          <button
            onClick={handleIssueCredential}
            disabled={loading}
            className="px-6 py-2 bg-black text-white font-bold rounded disabled:opacity-50"
          >
            Emitir Certificado
          </button>
        </section>

        <section className="border-4 border-black rounded-lg p-6">
          <h2 className="text-xl font-black mb-4 text-black">4. Revocar Certificado</h2>
          <input
            type="number"
            placeholder="ID del certificado a revocar"
            value={credentialToRevoke}
            onChange={(e) => setCredentialToRevoke(e.target.value)}
            className="w-full px-3 py-2 border-2 border-black rounded mb-4 text-black"
          />
          <button
            onClick={handleRevokeCredential}
            disabled={loading}
            className="px-6 py-2 bg-red-600 text-white font-bold rounded disabled:opacity-50"
          >
            Revocar
          </button>
        </section>
      </main>
    </div>
  );
}
