"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-black">
              ◆ Certificación Académica Digital
            </h1>
            <p className="text-sm text-black mt-1">
              Emisión y verificación de certificados en Solana
            </p>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      <main>
        <section className="bg-black text-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8 text-6xl">🎓</div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              Certificados Académicos
              <br />
              Inmutables y Verificables
            </h2>
            <p className="text-xl text-black max-w-2xl mx-auto mb-12 leading-relaxed">
              Sistema descentralizado para emitir, firmar y verificar diplomas,
              badges y certificados académicos. Verificación instantánea en
              blockchain Solana.
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/verify"
                className="inline-block bg-white text-black font-black py-4 px-12 rounded-lg border-4 border-white hover:bg-gray-100 transition transform hover:scale-105 text-lg"
              >
                ✓ Verificar Certificado
              </Link>
              {publicKey && (
                <Link
                  href="/dashboard"
                  className="inline-block bg-white text-black font-black py-4 px-12 rounded-lg border-4 border-white hover:bg-gray-100 transition transform hover:scale-105 text-lg"
                >
                  📊 Dashboard
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-4xl font-black text-black mb-16 text-center">
              ¿Por qué Solana?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white border-4 border-black rounded-lg p-8">
                <div className="text-5xl mb-4">💰</div>
                <h4 className="text-2xl font-black text-black mb-3">
                  Coste Mínimo
                </h4>
                <p className="text-black font-medium">
                  ~$0.00025 por certificado vs $5-50 en Ethereum. Emisión masiva
                  económica.
                </p>
              </div>
              <div className="bg-white border-4 border-black rounded-lg p-8">
                <div className="text-5xl mb-4">⚡</div>
                <h4 className="text-2xl font-black text-black mb-3">
                  Verificación Rápida
                </h4>
                <p className="text-black font-medium">
                  Verificación en ~400ms. Empleadores validan credenciales al
                  instante.
                </p>
              </div>
              <div className="bg-white border-4 border-black rounded-lg p-8">
                <div className="text-5xl mb-4">🔐</div>
                <h4 className="text-2xl font-black text-black mb-3">
                  Propiedad del Estudiante
                </h4>
                <p className="text-black font-medium">
                  El certificado pertenece al estudiante. Portabilidad e
                  independencia del emisor.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t-4 border-black py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-black font-semibold">
            © 2025 Certificación Académica Digital. academic_sol en Solana.
          </p>
        </div>
      </footer>
    </div>
  );
}
