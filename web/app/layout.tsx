import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/context/WalletProvider";
import { ProgramProvider } from "@/lib/context/ProgramProvider";
import { WalletChangeDetector } from "@/components/WalletChangeDetector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Certificación Académica Digital",
  description: "Sistema de emisión y verificación de certificados académicos en Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <WalletChangeDetector />
          <ProgramProvider>{children}</ProgramProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
