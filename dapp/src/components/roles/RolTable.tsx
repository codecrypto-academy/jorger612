'use client';

import { Rol } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShieldCheckIcon, PencilSquareIcon, NoSymbolIcon, ClockIcon } from '@heroicons/react/24/outline';

interface RolTableProps {
  roles: Rol[];
  loading: boolean;
  isOwner: boolean;
  onModificar: (rol: Rol) => void;
  onInhabilitar: (rol: Rol) => void;
  onHistorial: (rol: Rol) => void;
}

export function RolTable({ roles, loading, isOwner, onModificar, onInhabilitar, onHistorial }: RolTableProps) {
  if (loading) {
    return (
      <div className="space-y-2" data-testid="rol-table-loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-[#191D24] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!roles.length) {
    return (
      <EmptyState
        title="Sin roles registrados"
        description="Crea el primer rol para comenzar a gestionar permisos en la blockchain."
        icon={<ShieldCheckIcon className="w-12 h-12" />}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#232A34] bg-[#0D0F12] shadow-xl shadow-black/30" data-testid="rol-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#232A34] bg-[#191D24]">
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">ID</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Nombre</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Estado</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider hidden lg:table-cell">Ejecutor</th>
            <th className="px-5 py-4 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232A34]">
          {roles.map(rol => (
            <tr key={rol.id} className="hover:bg-[#191D24]/50 transition-colors duration-300">
              <td className="px-5 py-4 font-mono text-[#6B7280]">#{rol.id}</td>
              <td className="px-5 py-4 font-medium text-[#FAFBFC]">{rol.nombre}</td>
              <td className="px-4 py-3"><Badge activo={rol.activo} /></td>
              <td className="px-5 py-4 font-mono text-[#6B7280] text-xs hidden lg:table-cell">
                {rol.ejecutor.slice(0, 8)}...{rol.ejecutor.slice(-6)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onHistorial(rol)} data-testid={`btn-historial-rol-${rol.id}`} aria-label={`Ver historial del rol ${rol.nombre}`}>
                    <ClockIcon className="w-3.5 h-3.5" /> Histórico
                  </Button>
                  {isOwner && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onModificar(rol)}
                        data-testid={`btn-modificar-rol-${rol.id}`}
                        disabled={!rol.activo}
                        aria-label={`Modificar rol ${rol.nombre}`}
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                        Modificar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onInhabilitar(rol)}
                        data-testid={`btn-inhabilitar-rol-${rol.id}`}
                        disabled={!rol.activo}
                        aria-label={`Inhabilitar rol ${rol.nombre}`}
                      >
                        <NoSymbolIcon className="w-3.5 h-3.5" />
                        Inhabilitar
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
