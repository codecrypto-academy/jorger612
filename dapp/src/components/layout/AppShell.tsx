'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const isLanding = pathname === '/' && !isConnected;

  if (isLanding) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 to-white">
        <Navbar variant="light" onMenuClick={() => {}} />
        <main className="flex-1 flex items-center justify-center p-6">
          {children}
        </main>
      </div>
    );
  }

  const isDashboard = pathname === '/';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuClick={() => setMobileMenuOpen(true)} variant={isDashboard ? 'light' : 'dark'} />
        <main className={`flex-1 overflow-y-auto p-8 ${isDashboard ? 'bg-[#eef2f7]' : 'bg-[#050608]'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
