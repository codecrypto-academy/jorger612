'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useCuentas } from '@/hooks/useCuentas';
import { useToast } from '@/hooks/useToast';
import { CuentaTable } from '@/components/cuentas/CuentaTable';
import { CuentaModal } from '@/components/cuentas/CuentaModal';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { CuentaAutorizada } from '@/types';
import { parseContractError } from '@/lib/contract';
import { PlusCircleIcon, ArrowPathIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function CuentasPage() {
  const { isConnected, signer, isOwner } = useWallet();
  const { cuentas, loading, fetchCuentas, crearCuenta, actualizarCuenta, eliminarCuenta } = useCuentas();
  const { toasts, addToast, removeToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'modificar'>('crear');
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaAutorizada | null>(null);
  const [confirmCuenta, setConfirmCuenta] = useState<CuentaAutorizada | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isConnected) fetchCuentas();
  }, [isConnected, fetchCuentas]);

  const handleCrear = () => {
    setModalMode('crear');
    setSelectedCuenta(null);
    setModalOpen(true);
  };
  const handleModificar = (c: CuentaAutorizada) => {
    setModalMode('modificar');
    setSelectedCuenta(c);
    setModalOpen(true);
  };

  const handleSubmit = useCallback(
    async (wallet: string, nombre: string) => {
      if (!signer) throw new Error('Wallet no conectada.');
      try {
        if (modalMode === 'crear') {
          await crearCuenta(signer, wallet, nombre);
          addToast('success', `Cuenta "${nombre}" creada correctamente.`);
        } else if (selectedCuenta) {
          await actualizarCuenta(signer, selectedCuenta.wallet, nombre);
          addToast('success', `Cuenta "${nombre}" actualizada.`);
        }
      } catch (err) {
        const msg = parseContractError(err);
        addToast('error', msg);
        throw err;
      }
    },
    [signer, modalMode, selectedCuenta, crearCuenta, actualizarCuenta, addToast],
  );

  const handleEliminar = useCallback(async () => {
    if (!signer || !confirmCuenta) return;
    setDeleteLoading(true);
    try {
      await eliminarCuenta(signer, confirmCuenta.wallet);
      addToast('success', `Cuenta "${confirmCuenta.nombre}" eliminada.`);
    } catch (err) {
      addToast('error', parseContractError(err));
    } finally {
      setDeleteLoading(false);
      setConfirmCuenta(null);
    }
  }, [signer, confirmCuenta, eliminarCuenta, addToast]);

  return (
    <div style={{ maxWidth: 1152, margin: '0 auto' }}>
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
            <UserGroupIcon style={{ width: 24, height: 24 }} />
          </div>
          <div className="ds-page-header__titles">
            <h2>Gestionar Cuentas</h2>
            <p>{cuentas.length} cuentas autorizadas</p>
          </div>
        </div>
        <div className="ds-toolbar">
          <Button variant="secondary" size="sm" onClick={() => void fetchCuentas()} disabled={loading}>
            <ArrowPathIcon style={{ width: 16, height: 16, animation: loading ? 'dsSpin 0.8s linear infinite' : undefined }} />
            Actualizar
          </Button>
          {isConnected && isOwner && (
            <Button size="sm" onClick={handleCrear} data-testid="btn-crear-cuenta">
              <PlusCircleIcon style={{ width: 16, height: 16 }} />
              Crear Cuenta
            </Button>
          )}
        </div>
      </div>

      {!isConnected && <div className="ds-callout" style={{ marginBottom: 20 }}>Conecta tu wallet para visualizar las cuentas autorizadas.</div>}

      {isConnected && !isOwner && (
        <div className="ds-alert ds-alert--info" style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ds-text-title)' }}>
            Solo el propietario del contrato puede crear, modificar o eliminar cuentas autorizadas. Puedes visualizar la lista.
          </p>
        </div>
      )}

      {confirmCuenta !== null && (
        <div className="ds-confirm-row" style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, flex: 1, fontWeight: 600, fontSize: 14 }}>
            ¿Confirmas eliminar la cuenta &quot;{confirmCuenta.nombre}&quot; ({confirmCuenta.wallet.slice(0, 10)}...)?
          </p>
          <Button variant="danger" size="sm" loading={deleteLoading} onClick={handleEliminar} data-testid="btn-confirm-eliminar-cuenta">
            Eliminar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmCuenta(null)}>
            Cancelar
          </Button>
        </div>
      )}

      <CuentaTable
        cuentas={cuentas}
        loading={loading}
        isOwner={Boolean(isOwner)}
        onModificar={handleModificar}
        onEliminar={(c) => setConfirmCuenta(c)}
      />

      <CuentaModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} cuenta={selectedCuenta} mode={modalMode} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
