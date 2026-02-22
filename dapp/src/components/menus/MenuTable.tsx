'use client';

import { Menu, Rol } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Squares2X2Icon, PencilSquareIcon, NoSymbolIcon, LinkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MenuTableProps {
  menus: Menu[];
  roles: Rol[];
  loading: boolean;
  isOwner: boolean;
  onModificar: (m: Menu) => void;
  onInhabilitar: (m: Menu) => void;
  onAsociarRol: (m: Menu) => void;
  onHistorial: (m: Menu) => void;
}

export function MenuTable({ menus, loading, isOwner, onModificar, onInhabilitar, onAsociarRol, onHistorial }: MenuTableProps) {
  if (loading) return <div data-testid="menu-table-loading" className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#191D24] rounded-xl animate-pulse" />)}</div>;

  if (!menus.length) return <EmptyState title="Sin menus registrados" description="Crea el primer menu y asocia roles de acceso." icon={<Squares2X2Icon className="w-12 h-12" />} />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#232A34] bg-[#0D0F12] shadow-xl shadow-black/30" data-testid="menu-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#232A34] bg-[#191D24]">
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">ID</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Nombre</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Estado</th>
            <th className="px-5 py-4 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232A34]">
          {menus.map(m => (
            <tr key={m.id} className="hover:bg-[#191D24]/50 transition-colors duration-300">
              <td className="px-5 py-4 font-mono text-[#6B7280]">#{m.id}</td>
              <td className="px-5 py-4 font-medium text-[#FAFBFC]">{m.nombre}</td>
              <td className="px-5 py-4"><Badge activo={m.activo} /></td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onHistorial(m)} data-testid={`btn-historial-menu-${m.id}`} aria-label={`Ver historial del menu ${m.nombre}`}>
                    <ClockIcon className="w-3.5 h-3.5" /> Histórico
                  </Button>
                  {isOwner && (
                    <>
                      <Button variant="gold" size="sm" onClick={() => onAsociarRol(m)} data-testid={`btn-asociar-rol-${m.id}`} aria-label={`Asociar roles a menu ${m.nombre}`}>
                        <LinkIcon className="w-3.5 h-3.5" /> Roles
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onModificar(m)} data-testid={`btn-modificar-menu-${m.id}`} disabled={!m.activo}>
                        <PencilSquareIcon className="w-3.5 h-3.5" /> Modificar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onInhabilitar(m)} data-testid={`btn-inhabilitar-menu-${m.id}`} disabled={!m.activo}>
                        <NoSymbolIcon className="w-3.5 h-3.5" /> Inhabilitar
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
