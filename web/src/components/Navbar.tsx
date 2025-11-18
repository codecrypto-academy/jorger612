"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useWeb3 } from "@/context/Web3Context";

const links = [
  { href: "/", label: "Panel" },
  { href: "/available-operations", label: "Operaciones disponibles" },
  { href: "/admin", label: "Administración" },
];

export function Navbar() {
  const pathname = usePathname();
  const {
    address,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    isMetaMaskAvailable,
    connect,
  } = useWeb3();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : "—";

  const walletLabel = useMemo(() => {
    if (!isMounted) return "Iniciando interfaz…";
    if (!isMetaMaskAvailable) return "MetaMask no disponible";
    if (isConnecting) return "Conectando…";
    if (!isConnected) return "Conectar MetaMask";
    return isCorrectNetwork ? `MetaMask · ${shortAddress}` : `Red incorrecta · ${shortAddress}`;
  }, [isMounted, isMetaMaskAvailable, isConnecting, isConnected, isCorrectNetwork, shortAddress]);

  const statusBadge = useMemo(() => {
    if (!isMounted) return { text: "Sincronizando…", className: "badge" };
    if (!isMetaMaskAvailable) return { text: "Sin billetera", className: "badge error" };
    if (!isConnected) return { text: "Desconectado", className: "badge warning" };
    if (!isCorrectNetwork) return { text: "Cambiar a Anvil", className: "badge warning" };
    return { text: "Conectado · Anvil", className: "badge success" };
  }, [isMounted, isMetaMaskAvailable, isConnected, isCorrectNetwork]);

  const handleConnect = async () => {
    if (isConnected || isConnecting) return;
    setConnectionError(null);
    try {
      await connect();
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : "No se pudo conectar con MetaMask."
      );
    }
  };

  return (
    <header className="nav-shell">
      <div className="content nav-content">
        <div className="flex flex-col gap-3">
          <span className="pill pill--accent">Escrow Excellence</span>
          <div>
            <h1 className="text-3xl font-semibold leading-tight">
              Escrow P2P Executive Desk
            </h1>
            <p className="text-sm text-slate-300 max-w-xl mt-1">
              Mesa de intercambio premium para coordinar swaps tokenizados entre contrapartes
              verificadas en Anvil.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <div className="nav-links">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`wallet-indicator ${statusBadge.className}`}>
              {statusBadge.text}
            </span>
            <button
              type="button"
              className="button-primary"
              onClick={handleConnect}
              disabled={!isMounted || !isMetaMaskAvailable || isConnecting || isConnected}
            >
              {walletLabel}
            </button>
          </div>
          {connectionError && (
            <span className="text-xs text-red-300">{connectionError}</span>
          )}
        </div>
      </div>
    </header>
  );
}

