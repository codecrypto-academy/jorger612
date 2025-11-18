import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Escrow P2P Dashboard",
  description: "DApp para administrar operaciones P2P sobre el contrato Escrow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <div className="app-shell">
            <Navbar />
            <main className="content">{children}</main>
            <footer className="content footer">
              Operando en Anvil (chainId 31337 · http://localhost:8545)
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
