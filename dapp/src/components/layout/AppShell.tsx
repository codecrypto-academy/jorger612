'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { PortalAuthProvider } from '@/context/PortalAuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const isDesignDemo = pathname?.startsWith('/demo/diseno') ?? false;
  const isMarket = pathname === '/market' || pathname?.startsWith('/market/');
  const isHomeLanding = pathname === '/' && !isConnected;
  const isLanding = isHomeLanding || isMarket;
  const portalAuthEnabled = isConnected && !isMarket && !isDesignDemo;

  if (isDesignDemo) {
    return <>{children}</>;
  }

  if (isLanding) {
    return (
      <div className={`ds-landing${isHomeLanding ? ' ds-landing--rbac' : ''}`}>
        <Navbar variant="light" onMenuClick={() => {}} hideWalletButton={isHomeLanding} />
        <main className="ds-landing__main">{children}</main>
      </div>
    );
  }

  const isDashboard = pathname === '/';

  return (
    <PortalAuthProvider enabled={portalAuthEnabled}>
    <div className="ds-app-shell">
      <div className="ds-app-shell__row">
        <Sidebar
          isMobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onNavigate={() => setMobileMenuOpen(false)}
        />
        <div className="ds-main-col">
          <Navbar onMenuClick={() => setMobileMenuOpen(true)} variant={isDashboard ? 'light' : 'light'} />
          <main className={`ds-main-scroll${isDashboard ? ' ds-main-scroll--dashboard' : ''}`}>
            <div className={isDashboard ? 'ds-page-inner ds-page-inner--wide' : 'ds-page-inner'}>{children}</div>
          </main>
        </div>
      </div>
    </div>
    </PortalAuthProvider>
  );
}
