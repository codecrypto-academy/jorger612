'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useMenus } from '@/hooks/useMenus';
import { useRoles } from '@/hooks/useRoles';
import { useToast } from '@/hooks/useToast';
import { MenuTable } from '@/components/menus/MenuTable';
import { MenuModal } from '@/components/menus/MenuModal';
import { MenuRolModal } from '@/components/menus/MenuRolModal';
import { HistorialModal } from '@/components/ui/HistorialModal';
import { Button } from '@/components/ui/Button';
import { ToastContainer } from '@/components/ui/Toast';
import { Menu } from '@/types';
import { useHistorial, HistorialItem } from '@/hooks/useHistorial';
import { parseContractError } from '@/lib/contract';
import { useIsCuentaAutorizada } from '@/hooks/useIsCuentaAutorizada';
import { AlertaCuentaNoAutorizada } from '@/components/ui/AlertaCuentaNoAutorizada';
import { PlusCircleIcon, ArrowPathIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

export default function MenusPage() {
  const { isConnected, account, signer, provider } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const canManage = isConnected && isAuthorized && !authLoading;
  const { menus, loading, fetchMenus, crearMenu, modificarMenu, inhabilitarMenu, vincularMenuARol, desvincularMenuDeRol, verificarAcceso } = useMenus();
  const { roles, fetchRoles } = useRoles();
  const { toasts, addToast, removeToast } = useToast();
  const { fetchHistorialMenu, loading: historialLoading } = useHistorial(provider ?? undefined);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'crear' | 'modificar'>('crear');
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [rolModalOpen, setRolModalOpen] = useState(false);
  const [menuParaRol, setMenuParaRol] = useState<Menu | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [inhibLoading, setInhibLoading] = useState(false);
  const [historialMenu, setHistorialMenu] = useState<Menu | null>(null);
  const [historialItems, setHistorialItems] = useState<HistorialItem[]>([]);

  useEffect(() => {
    if (isConnected) { fetchMenus(); fetchRoles(); }
  }, [isConnected, fetchMenus, fetchRoles]);

  useEffect(() => {
    if (historialMenu) {
      const rolesMap = new Map(roles.map((r) => [r.id, r.nombre]));
      fetchHistorialMenu(historialMenu.id, rolesMap).then(setHistorialItems);
    } else {
      setHistorialItems([]);
    }
  }, [historialMenu, fetchHistorialMenu, roles]);

  const handleCrear = () => { setModalMode('crear'); setSelectedMenu(null); setModalOpen(true); };
  const handleModificar = (m: Menu) => { setModalMode('modificar'); setSelectedMenu(m); setModalOpen(true); };
  const handleAsociarRol = (m: Menu) => { setMenuParaRol(m); setRolModalOpen(true); };

  const handleSubmit = useCallback(async (nombre: string) => {
    if (!signer) throw new Error('Wallet no conectada.');
    try {
      if (modalMode === 'crear') {
        await crearMenu(signer, nombre);
        addToast('success', `Menu "${nombre}" creado.`);
      } else if (selectedMenu) {
        await modificarMenu(signer, selectedMenu.id, nombre);
        addToast('success', `Menu "${nombre}" modificado.`);
      }
    } catch (err) {
      const msg = parseContractError(err);
      addToast('error', msg);
      throw err;
    }
  }, [signer, modalMode, selectedMenu, crearMenu, modificarMenu, addToast]);

  const handleInhabilitar = useCallback(async (id: number) => {
    if (!signer) return;
    setInhibLoading(true);
    try {
      await inhabilitarMenu(signer, id);
      addToast('success', `Menu #${id} inhabilitado.`);
    } catch (err) {
      addToast('error', parseContractError(err));
    } finally {
      setInhibLoading(false);
      setConfirmId(null);
    }
  }, [signer, inhabilitarMenu, addToast]);

  const handleVincular = useCallback(async (rolId: number, menuId: number) => {
    if (!signer) throw new Error('Wallet no conectada.');
    await vincularMenuARol(signer, rolId, menuId);
    addToast('success', `Menu vinculado al rol #${rolId}.`);
  }, [signer, vincularMenuARol, addToast]);

  const handleDesvincular = useCallback(async (rolId: number, menuId: number) => {
    if (!signer) throw new Error('Wallet no conectada.');
    await desvincularMenuDeRol(signer, rolId, menuId);
    addToast('info', `Menu desvinculado del rol #${rolId}.`);
  }, [signer, desvincularMenuDeRol, addToast]);

  const cuentaNoRegistrada = isConnected && !authLoading && !isAuthorized;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {!isConnected && (
        <div className="px-5 py-4 rounded-2xl bg-[#C9A227]/10 border border-[#C9A227]/30 text-[#D4AF37] text-sm font-medium">
          Conecta tu wallet para gestionar menus.
        </div>
      )}

      {cuentaNoRegistrada && <AlertaCuentaNoAutorizada />}

      {isConnected && (authLoading || isAuthorized) && (
        <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#C9A227]/15 border border-[#C9A227]/40 text-[#D4AF37]">
            <Squares2X2Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#FAFBFC] tracking-tight">Gestion de Menus</h2>
            <p className="text-xs text-[#6B7280]">{menus.length} registros · {menus.filter(m => m.activo).length} activos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { fetchMenus(); fetchRoles(); }} disabled={loading}>
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          {canManage && (
            <Button size="sm" onClick={handleCrear} data-testid="btn-crear-menu">
              <PlusCircleIcon className="w-4 h-4" />
              Crear Menu
            </Button>
          )}
        </div>
      </div>

      {confirmId !== null && (
        <div className="px-5 py-5 rounded-2xl bg-[#4C1D1D]/30 border border-red-500/40 flex flex-wrap items-center gap-4 animate-fadeIn">
          <p className="text-sm text-red-200 flex-1 font-medium">¿Confirmas inhabilitar el Menu #{confirmId}?</p>
          <Button variant="danger" size="sm" loading={inhibLoading} onClick={() => handleInhabilitar(confirmId)} data-testid="btn-confirm-inhabilitar-menu">Inhabilitar</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancelar</Button>
        </div>
      )}

      <MenuTable
        menus={menus}
        roles={roles}
        loading={loading}
        isOwner={canManage}
        onModificar={handleModificar}
        onInhabilitar={(m) => setConfirmId(m.id)}
        onAsociarRol={handleAsociarRol}
        onHistorial={(m) => setHistorialMenu(m)}
      />

      <MenuModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} menu={selectedMenu} mode={modalMode} />
      <HistorialModal
        isOpen={historialMenu !== null}
        onClose={() => setHistorialMenu(null)}
        titulo="Histórico de movimientos"
        subtitulo={historialMenu ? `${historialMenu.nombre} #${historialMenu.id}` : ''}
        items={historialItems}
        loading={historialLoading}
      />
      <MenuRolModal
        isOpen={rolModalOpen}
        onClose={() => setRolModalOpen(false)}
        menu={menuParaRol}
        roles={roles}
        onVincular={handleVincular}
        onDesvincular={handleDesvincular}
        verificarAcceso={verificarAcceso}
      />
        </>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
