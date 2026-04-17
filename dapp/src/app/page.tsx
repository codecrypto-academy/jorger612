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
  InformationCircleIcon,
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
    <div className="ds-container" style={{ animation: 'dsFadeIn 0.35s ease' }}>
      <div className="ds-card" style={{ maxWidth: 440, margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            margin: '0 auto 24px',
            borderRadius: 16,
            background: 'var(--ds-gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
          }}
        >
          <ShieldCheckIcon style={{ width: 36, height: 36 }} />
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: '1.75rem', fontWeight: 700, color: 'var(--ds-text-title)' }}>Bienvenido</h1>
        <p style={{ color: 'var(--ds-text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Conecta MetaMask para acceder al <strong style={{ color: 'var(--ds-accent-start)' }}>sistema RBAC</strong> en blockchain.
        </p>
        <button type="button" onClick={connect} data-testid="btn-connect-metamask" className="ds-btn" style={{ width: '100%', textTransform: 'none' }}>
          <WalletIcon style={{ width: 20, height: 20 }} /> Conectar con MetaMask
        </button>
        <p style={{ fontSize: 12, color: 'var(--ds-gray-600)', marginTop: 20, marginBottom: 0 }}>Necesitas la extensión MetaMask instalada</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { isConnected, account, isOwner } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const { fetchRoles } = useRoles();
  const { fetchUsuarios } = useUsuarios();
  const { menus, fetchMenus } = useMenus();

  useEffect(() => {
    if (isConnected) {
      fetchRoles();
      fetchUsuarios();
      fetchMenus();
    }
  }, [isConnected, fetchRoles, fetchUsuarios, fetchMenus]);

  if (!isConnected) return <WelcomeCard />;

  return (
    <div style={{ animation: 'dsFadeIn 0.35s ease' }}>
      {!authLoading && isOwner && !isAuthorized && (
        <div className="ds-alert ds-alert--info" role="alert" style={{ marginBottom: 20, alignItems: 'flex-start' }}>
          <InformationCircleIcon style={{ width: 24, height: 24, flexShrink: 0, color: 'var(--ds-accent-start)', marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--ds-text-title)', fontSize: 14 }}>Eres el owner del contrato — registra tu cuenta para operar</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
              Tu dirección es la propietaria del contrato pero aún no está registrada como cuenta autorizada. Ve a <strong>Gestionar Cuentas</strong> y añade tu propia dirección para poder gestionar roles, usuarios y menús.
            </p>
          </div>
        </div>
      )}

      {!authLoading && !isOwner && !isAuthorized && <AlertaCuentaNoAutorizada style={{ marginBottom: 20 }} />}

      <div className="ds-grid" style={{ marginBottom: 24 }}>
        {MENU_CARDS.map(({ href, label, description, Icon, showCount }) => (
          <Link
            key={href}
            href={href}
            className="ds-card"
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 16 }}
            data-testid={`card-${href.slice(1)}`}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'rgba(102, 126, 234, 0.12)',
                color: 'var(--ds-accent-start)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon style={{ width: 22, height: 22 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ds-text-title)' }}>{label}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ds-gray-600)', lineHeight: 1.4 }}>{description}</p>
              {showCount && <p style={{ margin: '10px 0 0', fontSize: 22, fontWeight: 800, color: 'var(--ds-text-title)' }}>{menus.length}</p>}
            </div>
          </Link>
        ))}
      </div>

      <div className="ds-card">
        <h2 className="ds-card__title">Sistema de Estructura de Seguridad</h2>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
          Gestiona roles, usuarios y menús en un sistema RBAC descentralizado sobre blockchain.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--ds-text-title)' }}>Rol</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ds-gray-600)', lineHeight: 1.6 }}>Define y asigna permisos. Controla qué acciones puede ejecutar cada usuario.</p>
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--ds-text-title)' }}>Usuario</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ds-gray-600)', lineHeight: 1.6 }}>Administra perfiles, asigna roles y gestiona las cuentas de forma segura.</p>
          </div>
          <div>
            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--ds-text-title)' }}>Menú</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ds-gray-600)', lineHeight: 1.6 }}>Configura las opciones de navegación según los permisos de cada rol.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
