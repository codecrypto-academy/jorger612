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

  const handleCrear = () => { setModalMode('crear'); setSelectedCuenta(null); setModalOpen(true); };
  const handleModificar = (c: CuentaAutorizada) => { setModalMode('modificar'); setSelectedCuenta(c); setModalOpen(true); };

  const handleSubmit = useCallback(async (wallet: string, nombre: string) => {
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
  }, [signer, modalMode, selectedCuenta, crearCuenta, actualizarCuenta, addToast]);

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
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/15 border border-violet-500/40 text-violet-400">
            <UserGroupIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FAFBFC] tracking-tight">Gestionar Cuentas</h2>
            <p className="text-xs text-[#6B7280]">{cuentas.length} cuentas autorizadas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchCuentas} disabled={loading}>
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {isConnected && isOwner && (
            <Button size="sm" onClick={handleCrear} data-testid="btn-crear-cuenta">
              <PlusCircleIcon className="w-4 h-4" />
              Crear Cuenta
            </Button>
          )}
        </div>
      </div>

      {!isConnected && (
        <div className="px-5 py-4 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#D4AF37] text-sm font-medium">
          Conecta tu wallet para visualizar las cuentas autorizadas.
        </div>
      )}

      {isConnected && !isOwner && (
        <div className="px-5 py-4 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-sm font-medium">
          Solo el propietario del contrato puede crear, modificar o eliminar cuentas autorizadas. Puedes visualizar la lista.
        </div>
      )}

      {confirmCuenta !== null && (
        <div className="px-5 py-5 rounded-2xl bg-[#4C1D1D]/30 border border-red-500/40 flex flex-wrap items-center gap-4 animate-fadeIn">
          <p className="text-sm text-red-200 flex-1 font-medium">
            ¿Confirmas eliminar la cuenta &quot;{confirmCuenta.nombre}&quot; ({confirmCuenta.wallet.slice(0, 10)}...)?
          </p>
          <Button variant="danger" size="sm" loading={deleteLoading} onClick={handleEliminar} data-testid="btn-confirm-eliminar-cuenta">Eliminar</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmCuenta(null)}>Cancelar</Button>
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
