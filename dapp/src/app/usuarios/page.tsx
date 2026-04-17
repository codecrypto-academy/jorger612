'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useRoles } from '@/hooks/useRoles';
import { useMenus } from '@/hooks/useMenus';
import { useToast } from '@/hooks/useToast';
import { UsuarioTable } from '@/components/usuarios/UsuarioTable';
import { UsuarioModal } from '@/components/usuarios/UsuarioModal';
import { ArbolModal } from '@/components/usuarios/ArbolModal';
import { HistorialModal } from '@/components/ui/HistorialModal';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { Usuario } from '@/types';
import { useHistorial, HistorialItem } from '@/hooks/useHistorial';
import { parseContractError } from '@/lib/contract';
import { useIsCuentaAutorizada } from '@/hooks/useIsCuentaAutorizada';
import { AlertaCuentaNoAutorizada } from '@/components/ui/AlertaCuentaNoAutorizada';
import { PlusCircleIcon, ArrowPathIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function UsuariosPage() {
  const { isConnected, account, signer, provider } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const canManage = isConnected && isAuthorized && !authLoading;
  const { usuarios, loading, fetchUsuarios, crearUsuario, modificarUsuario, inhabilitarUsuario } = useUsuarios();
  const { roles, fetchRoles } = useRoles();
  const { obtenerMenusPorRol } = useMenus();
  const { toasts, addToast, removeToast } = useToast();
  const { fetchHistorialUsuario, loading: historialLoading } = useHistorial(provider ?? undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'modificar'>('crear');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [inhibLoading, setInhibLoading] = useState(false);
  const [historialUsuario, setHistorialUsuario] = useState<Usuario | null>(null);
  const [historialItems, setHistorialItems] = useState<HistorialItem[]>([]);
  const [arbolUsuario, setArbolUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    if (isConnected) { fetchUsuarios(); fetchRoles(); }
  }, [isConnected, fetchUsuarios, fetchRoles]);

  useEffect(() => {
    if (historialUsuario) {
      fetchHistorialUsuario(historialUsuario.id).then(setHistorialItems);
    } else {
      setHistorialItems([]);
    }
  }, [historialUsuario, fetchHistorialUsuario]);

  const handleCrear = () => { setModalMode('crear'); setSelectedUsuario(null); setModalOpen(true); };
  const handleModificar = (u: Usuario) => { setModalMode('modificar'); setSelectedUsuario(u); setModalOpen(true); };

  const handleSubmit = useCallback(async (login: string, nombre: string, rolId: number) => {
    if (!signer) throw new Error('Wallet no conectada.');
    try {
      if (modalMode === 'crear') {
        await crearUsuario(signer, login, nombre, rolId);
        addToast('success', `Usuario "${login}" creado correctamente.`);
      } else if (selectedUsuario) {
        await modificarUsuario(signer, selectedUsuario.id, login, nombre, rolId);
        addToast('success', `Usuario "${login}" actualizado.`);
      }
    } catch (err) {
      const msg = parseContractError(err);
      addToast('error', msg);
      throw err;
    }
  }, [signer, modalMode, selectedUsuario, crearUsuario, modificarUsuario, addToast]);

  const handleInhabilitar = useCallback(async (id: number) => {
    if (!signer) return;
    setInhibLoading(true);
    try {
      await inhabilitarUsuario(signer, id);
      addToast('success', `Usuario #${id} inhabilitado.`);
    } catch (err) {
      addToast('error', parseContractError(err));
    } finally {
      setInhibLoading(false);
      setConfirmId(null);
    }
  }, [signer, inhabilitarUsuario, addToast]);

  const cuentaNoRegistrada = isConnected && !authLoading && !isAuthorized;

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto' }}>
      {!isConnected && <div className="ds-callout" style={{ marginBottom: 20 }}>Conecta tu wallet para visualizar y gestionar usuarios.</div>}

      {cuentaNoRegistrada && <AlertaCuentaNoAutorizada style={{ marginBottom: 20 }} />}

      {isConnected && (authLoading || isAuthorized) && (
        <>
          <div className="ds-page-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.35)',
                }}
              >
                <UsersIcon style={{ width: 24, height: 24 }} />
              </div>
              <div className="ds-page-header__titles">
                <h2>Gestion de Usuarios</h2>
                <p>
                  {usuarios.length} registros · {usuarios.filter((u) => u.activo).length} activos
                </p>
              </div>
            </div>
            <div className="ds-toolbar">
              <Button variant="secondary" size="sm" onClick={() => { fetchUsuarios(); fetchRoles(); }} disabled={loading}>
                <ArrowPathIcon style={{ width: 16, height: 16, animation: loading ? 'dsSpin 0.8s linear infinite' : undefined }} />
                Actualizar
              </Button>
              {canManage && (
                <Button size="sm" onClick={handleCrear} data-testid="btn-crear-usuario">
                  <PlusCircleIcon style={{ width: 16, height: 16 }} />
                  Crear Usuario
                </Button>
              )}
            </div>
          </div>

          {confirmId !== null && (
            <div className="ds-confirm-row" style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, flex: 1, fontWeight: 600, fontSize: 14 }}>¿Confirmas inhabilitar al Usuario #{confirmId}?</p>
              <Button variant="danger" size="sm" loading={inhibLoading} onClick={() => handleInhabilitar(confirmId)} data-testid="btn-confirm-inhabilitar-usuario">
                Inhabilitar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                Cancelar
              </Button>
            </div>
          )}

      <UsuarioTable
        usuarios={usuarios}
        roles={roles}
        loading={loading}
        isOwner={canManage}
        onModificar={handleModificar}
        onInhabilitar={(u) => setConfirmId(u.id)}
        onHistorial={(u) => setHistorialUsuario(u)}
        onArbol={(u) => setArbolUsuario(u)}
      />

      <UsuarioModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} usuario={selectedUsuario} roles={roles} mode={modalMode} />
      <HistorialModal
        isOpen={historialUsuario !== null}
        onClose={() => setHistorialUsuario(null)}
        titulo="Histórico de movimientos"
        subtitulo={historialUsuario ? `${historialUsuario.login} · ${historialUsuario.nombre} #${historialUsuario.id}` : ''}
        items={historialItems}
        loading={historialLoading}
      />
      <ArbolModal
        isOpen={arbolUsuario !== null}
        onClose={() => setArbolUsuario(null)}
        usuario={arbolUsuario}
        roles={roles}
        obtenerMenusPorRol={obtenerMenusPorRol}
      />
        </>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
