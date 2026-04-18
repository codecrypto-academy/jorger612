'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheckIcon,
  HomeIcon,
  CubeIcon,
  PlusCircleIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useWallet } from '@/context/WalletContext';

const NAV_BASE = [
  { href: '/', label: 'Panel Principal', Icon: HomeIcon },
  { href: '/roles', label: 'Mis Roles', Icon: CubeIcon },
  { href: '/usuarios', label: 'Crear Usuario', Icon: PlusCircleIcon },
  { href: '/menus', label: 'Vinculos', Icon: PaperAirplaneIcon },
  { href: '/peticiones', label: 'Ver Peticiones', Icon: ClipboardDocumentListIcon, ownerOnly: true },
  { href: '/cuentas', label: 'Gestionar Cuentas', Icon: UserGroupIcon, ownerOnly: true },
] as const;

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}

function NavLinks({
  pathname,
  onNavigate,
  navItems,
}: {
  pathname: string;
  onNavigate?: () => void;
  navItems: ReadonlyArray<typeof NAV_BASE[number]>;
}) {
  return (
    <>
      {navItems.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={label}
            href={href}
            onClick={onNavigate}
            className={`ds-nav-link${active ? ' ds-nav-link--active' : ''}`}
            data-testid={`nav-${href === '/' ? 'dashboard' : href.slice(1)}`}
          >
            <span className="ds-nav-link__icon">
              <Icon style={{ width: 16, height: 16 }} />
            </span>
            {label}
            {active && <span className="ds-nav-link__dot" />}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar({ isMobileOpen = false, onClose, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isOwner } = useWallet();
  const navItems = NAV_BASE.filter((item) => !('ownerOnly' in item && item.ownerOnly) || isOwner);

  return (
    <>
      <aside className="ds-sidebar">
        <div className="ds-sidebar__brand">
          <div className="ds-sidebar__brand-icon">
            <ShieldCheckIcon style={{ width: 24, height: 24 }} />
          </div>
          <p className="ds-sidebar__brand-title">RBAC Blockchain</p>
        </div>
        <nav className="ds-sidebar__nav">
          <NavLinks pathname={pathname} navItems={navItems} />
        </nav>
      </aside>

      {isMobileOpen && (
        <div className="ds-mobile-root" aria-hidden="true">
          <div className="ds-mobile-backdrop" onClick={onClose} data-testid="mobile-overlay" />
          <aside className="ds-mobile-drawer" data-testid="mobile-drawer">
            <div className="ds-sidebar__brand">
              <div className="ds-sidebar__brand-icon">
                <ShieldCheckIcon style={{ width: 24, height: 24 }} />
              </div>
              <p className="ds-sidebar__brand-title">RBAC Blockchain</p>
            </div>
            <nav className="ds-sidebar__nav">
              <NavLinks pathname={pathname} onNavigate={onNavigate} navItems={navItems} />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
