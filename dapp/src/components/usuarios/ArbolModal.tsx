'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Usuario, Rol } from '@/types';
import { getReadOnlyContract } from '@/lib/contract';
import { UserCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface ArbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario | null;
  roles: Rol[];
  obtenerMenusPorRol: (rolId: number) => Promise<number[]>;
}

interface MenuInfo {
  id: number;
  nombre: string;
  activo: boolean;
}

export function ArbolModal({ isOpen, onClose, usuario, roles, obtenerMenusPorRol }: ArbolModalProps) {
  const [menus, setMenus] = useState<MenuInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !usuario) {
      setMenus([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const fetch = async () => {
      try {
        const menuIds = await obtenerMenusPorRol(usuario.rolId);
        const contract = getReadOnlyContract();
        const data: MenuInfo[] = [];
        for (const id of menuIds) {
          const m = await contract.menus(id);
          if (m.id) {
            data.push({
              id: Number(m.id),
              nombre: m.nombre,
              activo: m.activo,
            });
          }
        }
        if (!cancelled) setMenus(data);
      } catch {
        if (!cancelled) setMenus([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [isOpen, usuario, obtenerMenusPorRol]);

  const rolNombre = usuario ? roles.find((r) => r.id === usuario.rolId)?.nombre ?? `Rol #${usuario?.rolId}` : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Árbol de permisos" size="lg">
      {!usuario ? (
        <p className="text-sm text-[#6B7280]">Selecciona un usuario.</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden">
          <div className="font-sans select-none flex flex-col items-center mx-auto w-full max-w-md">
            {/* Nivel 1: Usuario (raíz) */}
            <div className="flex items-center gap-4 pb-6 w-full">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/25 border-2 border-emerald-500/50 text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <UserCircleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 border-l-2 border-emerald-500/30 pl-4 ml-1">
              <p className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Usuario</p>
              <p className="text-base font-bold text-[#FAFBFC]">{usuario.nombre}</p>
              <p className="text-xs text-[#6B7280] font-mono mt-0.5">{usuario.login} · #{usuario.id}</p>
            </div>
          </div>

            {/* Nivel 2: Rol */}
            <div className="flex items-center gap-4 py-4 pl-6 w-full">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/25 border-2 border-amber-500/50 text-amber-400 shrink-0 -ml-[2px]">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 border-l-2 border-amber-500/30 pl-4 ml-1">
              <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">Rol asignado</p>
              <p className="text-sm font-semibold text-[#FAFBFC]">{rolNombre}</p>
            </div>
          </div>

            {/* Nivel 3: Opciones de menú */}
            <div className="flex flex-col gap-2 py-2 pl-6 w-full">
              <p className="text-[10px] font-bold text-sky-400/80 uppercase tracking-widest mb-1">
                Opciones de menú ({loading ? '...' : menus.length})
              </p>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 bg-[#191D24] rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : menus.length === 0 ? (
                <div className="py-4 px-4 rounded-xl bg-[#191D24]/60 border border-dashed border-[#232A34]">
                  <p className="text-sm text-[#6B7280]">Sin opciones de menú asociadas.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {menus.map((m) => (
                    <div
                      key={m.id}
                      className="py-2.5 px-4 rounded-lg bg-[#191D24] border border-[#232A34] hover:border-sky-500/40 transition-colors"
                    >
                      <span className="text-sm font-medium text-[#FAFBFC]">{m.nombre}</span>
                      {!m.activo && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 ml-2">Inactivo</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
