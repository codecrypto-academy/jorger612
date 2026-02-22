'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheckIcon, HomeIcon, CubeIcon, PlusCircleIcon, PaperAirplaneIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const NAV = [
  { href: '/', label: 'Panel Principal', Icon: HomeIcon, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  { href: '/roles', label: 'Mis Roles', Icon: CubeIcon, iconColor: 'text-amber-600', iconBg: 'bg-amber-50' },
  { href: '/usuarios', label: 'Crear Usuario', Icon: PlusCircleIcon, iconColor: 'text-sky-600', iconBg: 'bg-sky-50' },
  { href: '/menus', label: 'Vinculos', Icon: PaperAirplaneIcon, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  { href: '/cuentas', label: 'Gestionar Cuentas', Icon: UserGroupIcon, iconColor: 'text-violet-600', iconBg: 'bg-violet-50' },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
}

const navLinkBase = 'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300';
const navLinkActive = 'bg-sky-100 text-sky-700 border border-sky-200 shadow-sm';
const navLinkInactive = 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent';

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map(({ href, label, Icon, iconColor, iconBg }) => {
        const active = pathname === href;
        const linkClass = `${navLinkBase} ${active ? navLinkActive : navLinkInactive}`;
        return (
          <Link key={label} href={href} onClick={onNavigate} className={linkClass} data-testid={`nav-${href === '/' ? 'dashboard' : href.slice(1)}`}>
            <div className={`p-1.5 rounded-lg ${iconBg} ${iconColor}`}>
              <Icon className="w-4 h-4 shrink-0" />
            </div>
            {label}
            {active && <span className="ml-auto w-2 h-2 rounded-full bg-sky-500 shrink-0" />}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar({ isMobileOpen = false, onClose, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200 shrink-0 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-4 px-6 py-6 border-b border-slate-200">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-400/30">
            <ShieldCheckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-[15px] text-slate-900 leading-none tracking-tight">RBAC Blockchain</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} data-testid="mobile-overlay" />
          <aside className="absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl animate-slideInLeft z-50" data-testid="mobile-drawer">
            <div className="flex items-center gap-4 px-6 py-6 border-b border-slate-200">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <ShieldCheckIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-[15px] text-slate-900 leading-none">RBAC Blockchain</p>
              </div>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              <NavLinks pathname={pathname} onNavigate={onNavigate} />
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
