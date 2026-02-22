'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Menu, Rol } from '@/types';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

interface MenuRolModalProps {
  isOpen: boolean;
  onClose: () => void;
  menu: Menu | null;
  roles: Rol[];
  onVincular: (rolId: number, menuId: number) => Promise<void>;
  onDesvincular: (rolId: number, menuId: number) => Promise<void>;
  verificarAcceso: (rolId: number, menuId: number) => Promise<boolean>;
}

export function MenuRolModal({ isOpen, onClose, menu, roles, onVincular, onDesvincular, verificarAcceso }: MenuRolModalProps) {
  const [accesos, setAccesos] = useState<Record<number, boolean>>({});
  const [loadingRolId, setLoadingRolId] = useState<number | null>(null);
  const [loadingAccesos, setLoadingAccesos] = useState(false);
  const [error, setError] = useState('');

  const rolesActivos = roles.filter(r => r.activo);
  const menuRef = useRef(menu);
  const rolesRef = useRef(roles);
  menuRef.current = menu;
  rolesRef.current = roles;

  const cargarAccesos = useCallback(async () => {
    const m = menuRef.current;
    const r = rolesRef.current;
    if (!m) return;
    const activos = r.filter(x => x.activo);
    if (activos.length === 0) {
      setAccesos({});
      return;
    }
    setLoadingAccesos(true);
    try {
      const results = await Promise.all(
        activos.map(async rol => ({ id: rol.id, acceso: await verificarAcceso(rol.id, m.id) }))
      );
      setAccesos(Object.fromEntries(results.map(x => [x.id, x.acceso])));
    } catch { setAccesos({}); }
    finally { setLoadingAccesos(false); }
  }, [verificarAcceso]);

  useEffect(() => {
    if (isOpen && menu) {
      cargarAccesos();
      setError('');
    }
  }, [isOpen, menu?.id, cargarAccesos]);

  const toggle = async (rol: Rol) => {
    if (!menu) return;
    setLoadingRolId(rol.id); setError('');
    try {
      if (accesos[rol.id]) await onDesvincular(rol.id, menu.id);
      else await onVincular(rol.id, menu.id);
      await cargarAccesos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar vinculo.');
    } finally { setLoadingRolId(null); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={menu ? `Asociar Roles: ${menu.nombre}` : 'Asociar Roles al Menu'} size="md">
      {menu && (
        <div className="space-y-4">
          {error && <p data-testid="menu-rol-error" className="text-xs text-red-300 font-medium bg-red-950/40 px-3 py-2 rounded-lg border-2 border-red-500/50">{error}</p>}

          <div className="space-y-2" data-testid="menu-rol-list">
            {loadingAccesos ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-[#191D24] rounded-xl animate-pulse" />)}</div>
            ) : rolesActivos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No hay roles activos disponibles.</p>
            ) : (
              rolesActivos.map(rol => (
                <div key={rol.id} className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-300 ${
                  accesos[rol.id] ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-[#191D24] border-[#232A34]'
                }`}>
                  <div className="flex items-center gap-3">
                    <Badge activo={accesos[rol.id] ?? false} activeLabel="Vinculado" inactiveLabel="No vinculado" />
                    <div>
                      <p className="text-sm font-medium text-[#F8FAFC]">{rol.nombre}</p>
                      <p className="text-xs font-mono text-slate-500">#{rol.id}</p>
                    </div>
                  </div>
                  <Button
                    variant={accesos[rol.id] ? 'danger' : 'primary'}
                    size="sm"
                    loading={loadingRolId === rol.id}
                    onClick={() => toggle(rol)}
                    data-testid={`btn-toggle-rol-${rol.id}`}
                    aria-label={accesos[rol.id] ? `Desvincular rol ${rol.nombre}` : `Vincular rol ${rol.nombre}`}
                  >
                    {accesos[rol.id]
                      ? <><MinusCircleIcon className="w-3.5 h-3.5" /> Desvincular</>
                      : <><PlusCircleIcon className="w-3.5 h-3.5" /> Vincular</>
                    }
                  </Button>
                </div>
              ))
            )}
          </div>

          <Button variant="secondary" onClick={onClose} className="w-full mt-2">Cerrar</Button>
        </div>
      )}
    </Modal>
  );
}
