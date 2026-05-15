'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheckIcon,
  HomeIcon,
  CubeIcon,
  UserCircleIcon,
  Squares2X2Icon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useWallet } from '@/context/WalletContext';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

type NavItem = {
  href: string;
  label: string;
  Icon: typeof HomeIcon;
  ownerOnly?: boolean;
};

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Seguridad',
    items: [
      { href: '/', label: 'Panel Principal', Icon: HomeIcon },
      { href: '/roles', label: 'Roles', Icon: CubeIcon },
      { href: '/usuarios', label: 'Usuarios', Icon: UserCircleIcon },
      { href: '/menus', label: 'Menús y vínculos', Icon: Squares2X2Icon },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { href: '/cuentas', label: 'Cuentas autorizadas', Icon: UserGroupIcon, ownerOnly: true },
      { href: '/peticiones', label: 'Peticiones market', Icon: ClipboardDocumentListIcon, ownerOnly: true },
    ],
  },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function NavSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="ds-sidebar__section">
      <p className="ds-sidebar__section-title">{title}</p>
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`ds-nav-link${active ? ' ds-nav-link--active' : ''}`}
            data-testid={`nav-${href === '/' ? 'dashboard' : href.slice(1)}`}
          >
            <span className="ds-nav-link__icon">
              <Icon style={{ width: 16, height: 16 }} />
            </span>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { isOwner, isConnected, account } = useWallet();

  const sections = NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((item) => !item.ownerOnly || isOwner),
  })).filter((sec) => sec.items.length > 0);

  return (
    <>
      <div className="ds-sidebar__brand">
        <div className="ds-sidebar__brand-icon">
          <ShieldCheckIcon style={{ width: 24, height: 24 }} />
        </div>
        <div>
          <p className="ds-sidebar__brand-title">RBAC Blockchain</p>
          <p className="ds-sidebar__brand-sub">Sistema de Seguridad</p>
        </div>
      </div>
      <nav className="ds-sidebar__nav">
        {sections.map((sec) => (
          <NavSection key={sec.title} title={sec.title} items={sec.items} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>
      {isConnected && account && (
        <div className="ds-sidebar__wallet">
          <p className="ds-sidebar__wallet-label">Wallet conectada</p>
          <p className="ds-sidebar__wallet-addr">
            <DocumentDuplicateIcon style={{ width: 14, height: 14, opacity: 0.7 }} />
            {shortAddr(account)}
          </p>
        </div>
      )}
    </>
  );
}

export function Sidebar({ isMobileOpen = false, onClose, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="ds-sidebar ds-sidebar--dark">
        <SidebarContent pathname={pathname} onNavigate={onNavigate} />
      </aside>

      {isMobileOpen && (
        <div className="ds-mobile-root" aria-hidden="true">
          <div className="ds-mobile-backdrop" onClick={onClose} data-testid="mobile-overlay" />
          <aside className="ds-mobile-drawer ds-sidebar--dark" data-testid="mobile-drawer">
            <SidebarContent pathname={pathname} onNavigate={onNavigate} />
          </aside>
        </div>
      )}
    </>
  );
}
