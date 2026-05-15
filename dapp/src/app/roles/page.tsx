'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useRoles } from '@/hooks/useRoles';
import { useToast } from '@/hooks/useToast';
import { RolTable } from '@/components/roles/RolTable';
import { RolModal } from '@/components/roles/RolModal';
import { HistorialModal } from '@/components/ui/HistorialModal';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { Rol } from '@/types';
import { useHistorial, HistorialItem } from '@/hooks/useHistorial';
import { parseContractError } from '@/lib/contract';
import { useIsCuentaAutorizada } from '@/hooks/useIsCuentaAutorizada';
import { AlertaCuentaNoAutorizada } from '@/components/ui/AlertaCuentaNoAutorizada';
import { PlusCircleIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function RolesPage() {
  const { isConnected, account, signer } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const canManage = isConnected && isAuthorized && !authLoading;
  const { roles, loading, fetchRoles, crearRol, modificarRol, inhabilitarRol } = useRoles();
  const { toasts, addToast, removeToast } = useToast();
  const { fetchHistorialRol, loading: historialLoading } = useHistorial();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'modificar'>('crear');
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [inhibLoading, setInhibLoading] = useState(false);
  const [historialRol, setHistorialRol] = useState<Rol | null>(null);
  const [historialItems, setHistorialItems] = useState<HistorialItem[]>([]);

  useEffect(() => {
    if (isConnected) fetchRoles();
  }, [isConnected, fetchRoles]);

  useEffect(() => {
    if (historialRol) {
      fetchHistorialRol(historialRol.id).then(setHistorialItems);
    } else {
      setHistorialItems([]);
    }
  }, [historialRol, fetchHistorialRol]);

  const handleCrear = () => {
    setModalMode('crear');
    setSelectedRol(null);
    setModalOpen(true);
  };
  const handleModificar = (rol: Rol) => {
    setModalMode('modificar');
    setSelectedRol(rol);
    setModalOpen(true);
  };

  const handleSubmit = useCallback(
    async (nombre: string) => {
      if (!signer) throw new Error('Wallet no conectada.');
      try {
        if (modalMode === 'crear') {
          await crearRol(signer, nombre);
          addToast('success', `Rol "${nombre}" creado correctamente.`);
        } else if (selectedRol) {
          await modificarRol(signer, selectedRol.id, nombre);
          addToast('success', `Rol "${nombre}" modificado correctamente.`);
        }
      } catch (err) {
        const msg = parseContractError(err);
        addToast('error', msg);
        throw err;
      }
    },
    [signer, modalMode, selectedRol, crearRol, modificarRol, addToast],
  );

  const handleInhabilitar = useCallback(
    async (id: number) => {
      if (!signer) return;
      setInhibLoading(true);
      try {
        await inhabilitarRol(signer, id);
        addToast('success', `Rol #${id} inhabilitado correctamente.`);
      } catch (err) {
        addToast('error', parseContractError(err));
      } finally {
        setInhibLoading(false);
        setConfirmId(null);
      }
    },
    [signer, inhabilitarRol, addToast],
  );

  const cuentaNoRegistrada = isConnected && !authLoading && !isAuthorized;

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto' }}>
      {!isConnected && <div className="ds-callout" style={{ marginBottom: 20 }}>Conecta tu wallet para visualizar y gestionar roles.</div>}

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
                <ShieldCheckIcon style={{ width: 24, height: 24 }} />
              </div>
              <div className="ds-page-header__titles">
                <h2>Gestion de Roles</h2>
                <p>
                  {roles.length} registros · {roles.filter((r) => r.activo).length} activos
                </p>
              </div>
            </div>
            <div className="ds-toolbar">
              <Button variant="secondary" size="sm" onClick={() => void fetchRoles()} disabled={loading}>
                <ArrowPathIcon style={{ width: 16, height: 16, animation: loading ? 'dsSpin 0.8s linear infinite' : undefined }} />
                Actualizar
              </Button>
              {canManage && (
                <Button size="sm" onClick={handleCrear} data-testid="btn-crear-rol">
                  <PlusCircleIcon style={{ width: 16, height: 16 }} />
                  Crear Rol
                </Button>
              )}
            </div>
          </div>

          {confirmId !== null && (
            <div className="ds-confirm-row" style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, flex: 1, fontWeight: 600, fontSize: 14 }}>¿Confirmas inhabilitar el Rol #{confirmId}?</p>
              <Button variant="danger" size="sm" loading={inhibLoading} onClick={() => handleInhabilitar(confirmId)} data-testid="btn-confirm-inhabilitar">
                Inhabilitar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                Cancelar
              </Button>
            </div>
          )}

          <RolTable
            roles={roles}
            loading={loading}
            isOwner={canManage}
            onModificar={handleModificar}
            onInhabilitar={(rol) => setConfirmId(rol.id)}
            onHistorial={(rol) => setHistorialRol(rol)}
          />

          <RolModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} rol={selectedRol} mode={modalMode} />
          <HistorialModal
            isOpen={historialRol !== null}
            onClose={() => setHistorialRol(null)}
            titulo="Histórico de movimientos"
            subtitulo={historialRol ? `${historialRol.nombre} #${historialRol.id}` : ''}
            items={historialItems}
            loading={historialLoading}
          />
        </>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
