'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useIsCuentaAutorizada } from '@/hooks/useIsCuentaAutorizada';
import { AlertaCuentaNoAutorizada } from '@/components/ui/AlertaCuentaNoAutorizada';
import { useRoles } from '@/hooks/useRoles';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useMenus } from '@/hooks/useMenus';
import {
  ShieldCheckIcon,
  UserCircleIcon,
  Bars3Icon,
  WalletIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const MENU_CARDS = [
  { href: '/roles', label: 'Rol', description: 'Gestionar permisos y accesos.', Icon: ShieldCheckIcon },
  { href: '/usuarios', label: 'Usuario', description: 'Administrar perfiles de usuario.', Icon: UserCircleIcon },
  { href: '/menus', label: 'Menú', description: 'Configurar opciones de navegación.', Icon: Bars3Icon, showCount: true },
  { href: '/cuentas', label: 'Gestionar Cuentas', description: 'Administrar cuentas autorizadas.', Icon: UserGroupIcon },
];

function WelcomeCard() {
  const { connect } = useWallet();
  return (
    <div className="w-full max-w-md mx-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-blue-600 flex items-center justify-center">
          <ShieldCheckIcon className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Welcome!</h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          Connect your MetaMask wallet to access the <span className="text-orange-500 font-medium">RBAC Blockchain system</span>
        </p>
        <button onClick={connect} data-testid="btn-connect-metamask" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-black hover:bg-slate-800 text-white text-sm font-medium">
          <WalletIcon className="w-5 h-5" /> Connect with MetaMask
        </button>
        <p className="text-xs text-slate-400 mt-6">Make sure you have MetaMask installed</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected, account } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const { fetchRoles } = useRoles();
  const { fetchUsuarios } = useUsuarios();
  const { menus, fetchMenus } = useMenus();

  useEffect(() => {
    if (isConnected) { fetchRoles(); fetchUsuarios(); fetchMenus(); }
  }, [isConnected, fetchRoles, fetchUsuarios, fetchMenus]);

  if (!isConnected) return <WelcomeCard />;

  return (
    <div className="min-h-full card-light-mode">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6 animate-fadeIn">
        {!authLoading && !isAuthorized && (
          <AlertaCuentaNoAutorizada className="mb-2" />
        )}

        {/* Cards - grid compacto */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
          {MENU_CARDS.map(({ href, label, description, Icon, showCount }) => (
            <Link
              key={href}
              href={href}
              className="card-light-mode bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-4 no-underline hover:shadow-md transition-all duration-300 min-w-0"
              data-testid={`card-${href.slice(1)}`}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900">{label}</h3>
                <p className="text-xs mt-0.5 text-slate-600">{description}</p>
                {showCount && (
                  <p className="mt-2 text-xl font-bold text-slate-900">{menus.length}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Sección Sistema de Estructura de Seguridad */}
        <div className="card-light-mode rounded-xl bg-white shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Sistema de Estructura de Seguridad</h2>
          <p className="text-sm text-slate-900 mb-6">
            Gestiona roles, usuarios y menús en un sistema RBAC descentralizado sobre blockchain.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Rol</h3>
              <p className="text-xs leading-relaxed text-slate-600">Define y asigna permisos. Controla qué acciones puede ejecutar cada usuario.</p>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Usuario</h3>
              <p className="text-xs leading-relaxed text-slate-600">Administra perfiles, asigna roles y gestiona las cuentas de forma segura.</p>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Menú</h3>
              <p className="text-xs leading-relaxed text-slate-600">Configura las opciones de navegación según los permisos de cada rol.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
