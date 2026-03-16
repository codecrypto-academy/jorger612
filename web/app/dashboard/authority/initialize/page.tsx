"use client";

import { useEffect } from "react";
import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useProgram } from "@/lib/context/ProgramProvider";
import { useDashboardRole } from "@/lib/hooks/useDashboardRole";
import { initializeProgram } from "@/lib/solana/instructions";

export default function InitializeAuthorityPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { program } = useProgram();
  const { canInitialize, isProgramInitialized, loading: roleLoading } =
    useDashboardRole();

  useEffect(() => {
    if (!publicKey) {
      router.push("/");
      return;
    }
    if (!roleLoading && !canInitialize) {
      router.push("/dashboard");
    }
  }, [publicKey, router, roleLoading, canInitialize]);

  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInitialize = async () => {
    if (!publicKey || !program) return;

    setIsInitializing(true);
    setError(null);
    setSuccess(false);

    try {
      const tx = await initializeProgram(program, publicKey);
      setSuccess(true);
      console.log("Program initialized:", tx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize");
    } finally {
      setIsInitializing(false);
    }
  };

  if (roleLoading || !canInitialize) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-black">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-black text-white py-16 px-4 border-b-4 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-5xl font-black mb-4">Initialize Program</h1>
          <p className="text-xl text-black">
            Configurar el programa academic_sol. Este paso solo puede hacerse una vez.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Authorization Card */}
        <div className="bg-white border-4 border-black rounded-lg p-8 mb-12">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h2 className="text-2xl font-black text-black mb-2">Authority Required</h2>
              <p className="text-black font-medium mb-4">
                Only the program authority can initialize the program. Your wallet will be registered as the program authority.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-black font-semibold">✓ Full control over role validation</p>
                <p className="text-sm text-black font-semibold">✓ Ability to manage all users</p>
                <p className="text-sm text-black font-semibold">✓ Permanent authority status</p>
              </div>
            </div>
          </div>
        </div>

        {/* What Gets Initialized */}
        <div className="mb-12">
          <h2 className="text-3xl font-black text-black mb-8">What Gets Initialized 🚀</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border-4 border-black rounded-lg p-6">
              <div className="text-4xl mb-3">1️⃣</div>
              <h3 className="text-xl font-black text-black mb-2">Program Authority</h3>
              <p className="text-black font-medium text-sm">
                Your wallet becomes the program authority with control over all operations.
              </p>
            </div>
            <div className="bg-white border-4 border-black rounded-lg p-6">
              <div className="text-4xl mb-3">2️⃣</div>
              <h3 className="text-xl font-black text-black mb-2">Registro de Instituciones</h3>
              <p className="text-black font-medium text-sm">
                Podrás registrar universidades e instituciones para emitir certificados.
              </p>
            </div>
            <div className="bg-white border-4 border-black rounded-lg p-6">
              <div className="text-4xl mb-3">3️⃣</div>
              <h3 className="text-xl font-black text-black mb-2">Sistema de Certificados</h3>
              <p className="text-black font-medium text-sm">
                El sistema de certificación académica queda listo para operar.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-4 border-red-200 text-red-800 px-6 py-4 rounded-lg mb-8 font-semibold">
            Error: {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-4 border-green-200 rounded-lg p-8 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-5xl">✨</div>
              <div>
                <h3 className="text-2xl font-black text-green-800 mb-2">
                  Program Initialized Successfully!
                </h3>
                <p className="text-green-700 font-medium mb-4">
                  El programa academic_sol está listo. Puedes registrar instituciones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleInitialize}
            disabled={isInitializing || success || isProgramInitialized}
            className="bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-black py-4 px-8 rounded-lg transition transform hover:-translate-y-2 text-lg flex items-center gap-2 disabled:transform-none disabled:hover:bg-black"
          >
            {isInitializing ? (
              <>⏳ Initializing...</>
            ) : success || isProgramInitialized ? (
              <span className="text-left max-w-md">
                El programa ya fue iniciado. Si desea iniciarlo nuevamente
                comuníquese con el departamento de tecnología.
              </span>
            ) : (
              <>🚀 Initialize Program</>
            )}
          </button>

          <Link
            href="/dashboard/institution"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-black py-4 px-8 rounded-lg transition transform hover:-translate-y-2 text-lg"
          >
            Panel Institución →
          </Link>
        </div>

        {/* Next Steps */}
        {success && (
          <div className="bg-black text-white rounded-lg border-4 border-black p-12 mt-12">
            <h2 className="text-3xl font-black mb-6">Next Steps 📋</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-black mb-3">1. Registrar Institución</h3>
                <p className="text-black font-medium">
                  Ve al Panel de Institución para registrar tu universidad y emitir certificados.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-black mb-3">2. Emitir Certificados</h3>
                <p className="text-black font-medium">
                  Una vez registrada, podrás emitir diplomas, badges y certificados a los estudiantes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
