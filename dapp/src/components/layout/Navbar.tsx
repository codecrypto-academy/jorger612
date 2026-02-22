'use client';

import { usePathname } from 'next/navigation';
import { Bars3Icon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { WalletButton } from '@/components/wallet/WalletButton';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/roles': 'Gestion de Roles',
  '/usuarios': 'Gestion de Usuarios',
  '/menus': 'Gestion de Menus',
  '/cuentas': 'Gestionar Cuentas',
};

interface NavbarProps {
  onMenuClick?: () => void;
  variant?: 'dark' | 'light';
}

export function Navbar({ onMenuClick, variant = 'dark' }: NavbarProps) {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? 'SecurityManager';

  if (variant === 'light') {
    return (
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 z-30">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden p-2.5 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            aria-label="Abrir menu"
            data-testid="btn-mobile-menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">RBAC Blockchain</span>
          </div>
        </div>
        <WalletButton variant="landing" />
      </header>
    );
  }

  return (
    <header className="h-16 bg-[#0D0F12]/90 backdrop-blur-xl border-b border-[#232A34] flex items-center justify-between px-5 md:px-8 shrink-0 z-30 shadow-lg shadow-black/20">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden p-2.5 -ml-2 rounded-xl text-[#9CA3AF] hover:text-[#FAFBFC] hover:bg-[#191D24] transition-all duration-300"
          aria-label="Abrir menu"
          data-testid="btn-mobile-menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-[15px] font-semibold text-[#FAFBFC] leading-tight tracking-tight">{title}</h1>
          <p className="text-[11px] text-[#6B7280] tracking-wide">Sistema RBAC Inmutable en Blockchain</p>
        </div>
      </div>
      <WalletButton />
    </header>
  );
}
