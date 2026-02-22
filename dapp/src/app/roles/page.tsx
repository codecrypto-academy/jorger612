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
  const { isConnected, account, signer, provider } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const canManage = isConnected && isAuthorized && !authLoading;
  const { roles, loading, fetchRoles, crearRol, modificarRol, inhabilitarRol } = useRoles();
  const { toasts, addToast, removeToast } = useToast();
  const { fetchHistorialRol, loading: historialLoading } = useHistorial(provider ?? undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'modificar'>('crear');
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [inhibLoading, setInhibLoading] = useState(false);
  const [historialRol, setHistorialRol] = useState<Rol | null>(null);
  const [historialItems, setHistorialItems] = useState<HistorialItem[]>([]);

  useEffect(() => { if (isConnected) fetchRoles(); }, [isConnected, fetchRoles]);

  useEffect(() => {
    if (historialRol) {
      fetchHistorialRol(historialRol.id).then(setHistorialItems);
    } else {
      setHistorialItems([]);
    }
  }, [historialRol, fetchHistorialRol]);

  const handleCrear = () => { setModalMode('crear'); setSelectedRol(null); setModalOpen(true); };
  const handleModificar = (rol: Rol) => { setModalMode('modificar'); setSelectedRol(rol); setModalOpen(true); };

  const handleSubmit = useCallback(async (nombre: string) => {
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
  }, [signer, modalMode, selectedRol, crearRol, modificarRol, addToast]);

  const handleInhabilitar = useCallback(async (id: number) => {
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
  }, [signer, inhabilitarRol, addToast]);

  const cuentaNoRegistrada = isConnected && !authLoading && !isAuthorized;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {!isConnected && (
        <div className="px-5 py-4 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#D4AF37] text-sm font-medium">
          Conecta tu wallet para visualizar y gestionar roles.
        </div>
      )}

      {cuentaNoRegistrada && <AlertaCuentaNoAutorizada />}

      {isConnected && (authLoading || isAuthorized) && (
        <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#C9A227]/15 border border-[#C9A227]/40 text-[#D4AF37]">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FAFBFC] tracking-tight">Gestion de Roles</h2>
            <p className="text-xs text-[#6B7280]">{roles.length} registros · {roles.filter(r => r.activo).length} activos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchRoles} disabled={loading}>
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {canManage && (
            <Button size="sm" onClick={handleCrear} data-testid="btn-crear-rol">
              <PlusCircleIcon className="w-4 h-4" />
              Crear Rol
            </Button>
          )}
        </div>
      </div>

      {confirmId !== null && (
        <div className="px-5 py-5 rounded-2xl bg-[#4C1D1D]/30 border border-red-500/40 flex flex-wrap items-center gap-4 animate-fadeIn">
          <p className="text-sm text-red-200 flex-1 font-medium">¿Confirmas inhabilitar el Rol #{confirmId}?</p>
          <Button variant="danger" size="sm" loading={inhibLoading} onClick={() => handleInhabilitar(confirmId)} data-testid="btn-confirm-inhabilitar">Inhabilitar</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancelar</Button>
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
