"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useDashboardRole } from "@/lib/hooks/useDashboardRole";

export default function DashboardPage() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const {
    loading,
    role,
    canInitialize,
    canRegisterInstitution,
    canCertify,
    canVerify,
    canSeeMyCertificates,
    canSeeCertificatesByStudent,
    isInstitution,
    isProgramInitialized,
  } = useDashboardRole();

  useEffect(() => {
    if (!publicKey) {
      router.push("/");
      return;
    }
  }, [publicKey, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-black">Cargando...</div>
      </div>
    );
  }

  const roleLabel =
    role === "admin"
      ? "Administrador"
      : role === "codecrypto"
        ? "CodeCrypto"
        : role === "estudiante"
          ? "Estudiante"
          : role === "empleador"
            ? "Empleador"
            : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-black">
              ◆ Dashboard - Certificación Académica
            </h1>
            {roleLabel && (
              <p className="text-sm text-black mt-1 font-semibold">
                Rol: {roleLabel}
              </p>
            )}
          </div>
          <Link
            href="/"
            className="px-4 py-2 border-2 border-black rounded font-bold text-black hover:bg-gray-100"
          >
            Inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid gap-6">
          {canInitialize && (
            isProgramInitialized ? (
              <div className="block p-6 border-4 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed">
                <h2 className="text-2xl font-black text-black mb-2">
                  🔐 Inicializar Programa (Authority)
                </h2>
                <p className="text-black">
                  El programa ya fue iniciado. Si desea iniciarlo nuevamente
                  comuníquese con el departamento de tecnología.
                </p>
              </div>
            ) : (
              <Link
                href="/dashboard/authority/initialize"
                className="block p-6 border-4 border-black rounded-lg hover:bg-gray-50 transition bg-yellow-50"
              >
                <h2 className="text-2xl font-black text-black mb-2">
                  🔐 Inicializar Programa (Authority)
                </h2>
                <p className="text-black">
                  Configuración inicial del programa. Solo una vez.
                </p>
              </Link>
            )
          )}

          {canVerify && (
            <Link
              href="/verify"
              className="block p-6 border-4 border-black rounded-lg hover:bg-gray-50 transition"
            >
              <h2 className="text-2xl font-black text-black mb-2">
                ✓ Verificar Certificado
              </h2>
              <p className="text-black">
                Verificar validez de un certificado por institución e ID
              </p>
            </Link>
          )}

          {canCertify && (
            isInstitution ? (
              <Link
                href="/dashboard/institution"
                className="block p-6 border-4 border-black rounded-lg hover:bg-gray-50 transition"
              >
                <h2 className="text-2xl font-black text-black mb-2">
                  🏛️ Panel de Institución
                </h2>
                <p className="text-black">
                  Emitir certificados, revocar, re-emitir
                </p>
              </Link>
            ) : (
              <div className="p-6 border-4 border-gray-300 rounded-lg bg-gray-50">
                <h2 className="text-2xl font-black text-black mb-2">
                  🏛️ Panel de Institución
                </h2>
                <p className="text-black">
                  No estás registrado como institución. El authority debe
                  registrarte con register_institution.
                </p>
              </div>
            )
          )}

          {canSeeCertificatesByStudent && (
            <Link
              href="/dashboard/institution/certificates-by-student"
              className="block p-6 border-4 border-black rounded-lg hover:bg-gray-50 transition"
            >
              <h2 className="text-2xl font-black text-black mb-2">
                📋 Certificados por Estudiante
              </h2>
              <p className="text-black">
                Ver todos los certificados agrupados por estudiante
              </p>
            </Link>
          )}

          {canSeeMyCertificates && (
            <Link
              href="/dashboard/student"
              className="block p-6 border-4 border-black rounded-lg hover:bg-gray-50 transition"
            >
              <h2 className="text-2xl font-black text-black mb-2">
                🎓 Mis Certificados
              </h2>
              <p className="text-black">
                Ver certificados emitidos a tu dirección
              </p>
            </Link>
          )}

          {!role && (
            <div className="p-6 border-4 border-gray-300 rounded-lg bg-gray-50">
              <h2 className="text-2xl font-black text-black mb-2">
                ℹ️ Acceso limitado
              </h2>
              <p className="text-black">
                Tu wallet no está asignada a ningún rol. Puedes verificar
                certificados desde el enlace anterior.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
