'use client';

import { usePathname } from 'next/navigation';
import { Bars3Icon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { WalletButton } from '@/components/wallet/WalletButton';
import { NETWORK_NAME } from '@/lib/config';
import { useWallet } from '@/context/WalletContext';

const TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Centro de Control RBAC',
    subtitle: 'Gestión de roles, usuarios y permisos sobre blockchain',
  },
  '/roles': { title: 'Gestión de Roles', subtitle: 'Sistema RBAC en blockchain' },
  '/usuarios': { title: 'Gestión de Usuarios', subtitle: 'Sistema RBAC en blockchain' },
  '/menus': { title: 'Gestión de Menús', subtitle: 'Sistema RBAC en blockchain' },
  '/peticiones': { title: 'Ver Peticiones', subtitle: 'Sistema RBAC en blockchain' },
  '/cuentas': { title: 'Gestionar Cuentas', subtitle: 'Sistema RBAC en blockchain' },
};

interface NavbarProps {
  onMenuClick?: () => void;
  variant?: 'dark' | 'light';
  /** Oculta Conectar Wallet (p. ej. landing RBAC con CTA en tarjeta). */
  hideWalletButton?: boolean;
}

export function Navbar({ onMenuClick, variant = 'dark', hideWalletButton = false }: NavbarProps) {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const landing = variant === 'light' && pathname !== '/';
  const isMarket = pathname === '/market' || (pathname?.startsWith('/market/') ?? false);
  const meta = TITLES[pathname] ?? { title: 'SecurityManager', subtitle: 'Sistema RBAC en blockchain' };
  const isDashboard = pathname === '/';

  return (
    <header className={`ds-navbar${isDashboard ? ' ds-navbar--dashboard' : ''}`}>
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
        {landing || isMarket ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ds-sidebar__brand-icon" style={{ width: 40, height: 40 }}>
              <ShieldCheckIcon style={{ width: 22, height: 22 }} />
            </div>
            <div className="ds-navbar__titles">
              <h1>RBAC Blockchain</h1>
              <p>{isMarket ? 'Solicitud de acceso' : 'Sistema RBAC en blockchain'}</p>
            </div>
          </div>
        ) : (
          <div className="ds-navbar__titles">
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>
        )}
      </div>
      <div className="ds-navbar__right">
        {isConnected && !isMarket && (
          <span className="ds-network-pill" title={`Red: ${NETWORK_NAME}`}>
            <span className="ds-inline-dot ds-inline-dot--ok" />
            {NETWORK_NAME} · Conectado
          </span>
        )}
        {!hideWalletButton && (
          <WalletButton variant={landing || isMarket ? 'landing' : 'default'} />
        )}
      </div>
    </header>
  );
}
