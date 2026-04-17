import type { Metadata } from 'next';
import './globals.css';
import '@/styles/design-system.css';
import { WalletProvider } from '@/context/WalletContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'SecurityManager | RBAC Blockchain',
  description: 'Sistema de gestion de permisos e identidades en blockchain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <WalletProvider>
          <AppShell>{children}</AppShell>
        </WalletProvider>
      </body>
    </html>
  );
}
