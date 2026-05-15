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
  const { isConnected, account, signer } = useWallet();
  const { isAuthorized, loading: authLoading } = useIsCuentaAutorizada(account);
  const canManage = isConnected && isAuthorized && !authLoading;
  const { menus, loading, fetchMenus, crearMenu, modificarMenu, inhabilitarMenu, vincularMenuARol, desvincularMenuDeRol, verificarAcceso } = useMenus();
  const { roles, fetchRoles } = useRoles();
  const { toasts, addToast, removeToast } = useToast();
  const { fetchHistorialMenu, loading: historialLoading } = useHistorial();

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
    <div style={{ maxWidth: 1152, margin: '0 auto' }}>
      {!isConnected && <div className="ds-callout" style={{ marginBottom: 20 }}>Conecta tu wallet para gestionar menus.</div>}

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
                <Squares2X2Icon style={{ width: 24, height: 24 }} />
              </div>
              <div className="ds-page-header__titles">
                <h2>Gestion de Menus</h2>
                <p>
                  {menus.length} registros · {menus.filter((m) => m.activo).length} activos
                </p>
              </div>
            </div>
            <div className="ds-toolbar">
              <Button variant="secondary" size="sm" onClick={() => { fetchMenus(); fetchRoles(); }} disabled={loading}>
                <ArrowPathIcon style={{ width: 16, height: 16, animation: loading ? 'dsSpin 0.8s linear infinite' : undefined }} />
                Actualizar
              </Button>
              {canManage && (
                <Button size="sm" onClick={handleCrear} data-testid="btn-crear-menu">
                  <PlusCircleIcon style={{ width: 16, height: 16 }} />
                  Crear Menu
                </Button>
              )}
            </div>
          </div>

          {confirmId !== null && (
            <div className="ds-confirm-row" style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, flex: 1, fontWeight: 600, fontSize: 14 }}>¿Confirmas inhabilitar el Menu #{confirmId}?</p>
              <Button variant="danger" size="sm" loading={inhibLoading} onClick={() => handleInhabilitar(confirmId)} data-testid="btn-confirm-inhabilitar-menu">
                Inhabilitar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
                Cancelar
              </Button>
            </div>
          )}

      <MenuTable
        menus={menus}
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
