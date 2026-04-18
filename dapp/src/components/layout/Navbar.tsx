'use client';

import { usePathname } from 'next/navigation';
import { Bars3Icon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { WalletButton } from '@/components/wallet/WalletButton';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/roles': 'Gestion de Roles',
  '/usuarios': 'Gestion de Usuarios',
  '/menus': 'Gestion de Menus',
  '/peticiones': 'Ver Peticiones',
  '/cuentas': 'Gestionar Cuentas',
};

interface NavbarProps {
  onMenuClick?: () => void;
  variant?: 'dark' | 'light';
}

export function Navbar({ onMenuClick, variant = 'dark' }: NavbarProps) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? 'SecurityManager';
  const landing = variant === 'light';
  const isMarket = pathname === '/market';

  return (
    <header className="ds-navbar">
      <div className="ds-navbar__left">
        {!landing && (
          <button
            type="button"
            onClick={onMenuClick}
            className="ds-navbar__menu-btn"
            aria-label="Abrir menu"
            data-testid="btn-mobile-menu"
          >
            <Bars3Icon style={{ width: 24, height: 24 }} />
          </button>
        )}
        {landing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ds-sidebar__brand-icon" style={{ width: 40, height: 40 }}>
              <ShieldCheckIcon style={{ width: 22, height: 22 }} />
            </div>
            <div className="ds-navbar__titles">
              <h1>{isMarket ? 'Market' : 'RBAC Blockchain'}</h1>
              <p>{isMarket ? 'Solicitud de acceso' : 'Sistema RBAC en blockchain'}</p>
            </div>
          </div>
        ) : (
          <div className="ds-navbar__titles">
            <h1>{title}</h1>
            <p>Sistema RBAC Inmutable en Blockchain</p>
          </div>
        )}
      </div>
      <WalletButton variant={landing ? 'landing' : 'default'} />
    </header>
  );
}
