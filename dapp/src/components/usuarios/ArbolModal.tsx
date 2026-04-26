'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Usuario, Rol } from '@/types';
import { API_URL } from '@/lib/api';
import { UserCircleIcon, ShieldCheckIcon, Squares2X2Icon, ArrowLongRightIcon } from '@heroicons/react/24/outline';

interface ArbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  roles: Rol[];
  account: string | null;
}

interface MenuInfo {
  id: string;
  label: string;
  allowed: boolean;
}

export function ArbolModal({ isOpen, onClose, usuario, roles, account }: ArbolModalProps) {
  const [menus, setMenus] = useState<MenuInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !usuario || !account) {
      setMenus([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/permissions/tree`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ address: account, login: usuario.login }),
          cache: 'no-store',
        });
        if (!res.ok) {
          if (!cancelled) setMenus([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setMenus(data?.menu ?? []);
      } catch {
        if (!cancelled) setMenus([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isOpen, usuario, account]);

  const rolNombre = usuario ? roles.find((r) => r.id === usuario.rolId)?.nombre ?? `Rol #${usuario?.rolId}` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Árbol de permisos" size="lg">
      {!usuario ? (
        <p style={{ margin: 0, fontSize: 14, color: '#495057' }}>Selecciona un usuario.</p>
      ) : (
        <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden' }}>
          <div
            style={{
              marginBottom: 18,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #e1e5e9',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: '#495057', fontWeight: 600 }}>
              Vista jerárquica: <span style={{ color: '#2c3e50' }}>Usuario</span> → <span style={{ color: '#2c3e50' }}>Rol</span> →{' '}
              <span style={{ color: '#2c3e50' }}>Menús</span>
            </p>
          </div>

          <div className="ds-tree-grid">
            {/* Nivel 1: Usuario */}
            <section
              style={{
                border: '1px solid #e1e5e9',
                borderRadius: 14,
                background: '#fff',
                boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: '#fff',
                  }}
                >
                  <UserCircleIcon style={{ width: 21, height: 21 }} />
                </div>
                <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6c757d', fontWeight: 700 }}>
                  Usuario
                </p>
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 16, color: '#111', fontWeight: 700 }}>{usuario.nombre}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#495057', fontFamily: 'var(--ds-font-mono)' }}>
                {usuario.login} · #{usuario.id}
              </p>
            </section>

            <div className="ds-tree-arrow" style={{ color: '#667eea' }}>
              <ArrowLongRightIcon style={{ width: 30, height: 30 }} />
            </div>

            {/* Nivel 2: Rol */}
            <section
              style={{
                border: '1px solid #e1e5e9',
                borderRadius: 14,
                background: '#fff',
                boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)',
                    color: '#212529',
                  }}
                >
                  <ShieldCheckIcon style={{ width: 20, height: 20 }} />
                </div>
                <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6c757d', fontWeight: 700 }}>
                  Rol
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 15, color: '#111', fontWeight: 700 }}>{rolNombre}</p>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#555' }}>Nodo intermedio de permisos</p>
            </section>

            <div className="ds-tree-arrow" style={{ color: '#667eea' }}>
              <ArrowLongRightIcon style={{ width: 30, height: 30 }} />
            </div>

            {/* Nivel 3: Menús */}
            <section
              style={{
                border: '1px solid #e1e5e9',
                borderRadius: 14,
                background: '#fff',
                boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                padding: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--ds-gradient-primary)',
                      color: '#fff',
                    }}
                  >
                    <Squares2X2Icon style={{ width: 20, height: 20 }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6c757d', fontWeight: 700 }}>
                    Menús ({loading ? '...' : menus.length})
                  </p>
                </div>
              </div>

              {loading ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        height: 42,
                        borderRadius: 10,
                        background: 'linear-gradient(90deg, #f1f3f5 20%, #ffffff 45%, #f1f3f5 70%)',
                        backgroundSize: '200% 100%',
                        animation: 'dsShimmer 1.1s ease-in-out infinite',
                        border: '1px solid #e9ecef',
                      }}
                    />
                  ))}
                </div>
              ) : menus.length === 0 ? (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px dashed #adb5bd',
                    background: '#f8f9fa',
                    color: '#495057',
                    fontSize: 14,
                  }}
                >
                  Sin opciones de menú asociadas.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {menus.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        borderRadius: 10,
                        border: '1px solid #e1e5e9',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 14, color: '#111', fontWeight: 600 }}>{m.label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6c757d', fontFamily: 'var(--ds-font-mono)' }}>Menu #{m.id}</p>
                      </div>
                      {!m.allowed && <span className="ds-badge ds-badge--error">No permitido</span>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      )}
    </Modal>
  );
}
