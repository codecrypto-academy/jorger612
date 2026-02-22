'use client';

import { CuentaAutorizada } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserGroupIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CuentaTableProps {
  cuentas: CuentaAutorizada[];
  loading: boolean;
  isOwner: boolean;
  onModificar: (cuenta: CuentaAutorizada) => void;
  onEliminar: (cuenta: CuentaAutorizada) => void;
}

export function CuentaTable({ cuentas, loading, isOwner, onModificar, onEliminar }: CuentaTableProps) {
  if (loading) {
    return (
      <div className="space-y-2" data-testid="cuenta-table-loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-[#191D24] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!cuentas.length) {
    return (
      <EmptyState
        title="Sin cuentas autorizadas"
        description="Solo el propietario del contrato puede crear cuentas autorizadas."
        icon={<UserGroupIcon className="w-12 h-12" />}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#232A34] bg-[#0D0F12] shadow-xl shadow-black/30" data-testid="cuenta-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#232A34] bg-[#191D24]">
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Wallet</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Nombre</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Estado</th>
            <th className="px-5 py-4 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232A34]">
          {cuentas.map((c) => (
            <tr key={c.wallet} className="hover:bg-[#191D24]/50 transition-colors duration-300">
              <td className="px-5 py-4 font-mono text-[#6B7280] text-xs">
                {c.wallet.slice(0, 10)}...{c.wallet.slice(-8)}
              </td>
              <td className="px-5 py-4 font-medium text-[#FAFBFC]">{c.nombre}</td>
              <td className="px-4 py-3"><Badge activo={c.activa} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {isOwner && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onModificar(c)}
                        data-testid={`btn-modificar-cuenta-${c.wallet.slice(-6)}`}
                        aria-label={`Modificar cuenta ${c.nombre}`}
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" /> Modificar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onEliminar(c)}
                        data-testid={`btn-eliminar-cuenta-${c.wallet.slice(-6)}`}
                        aria-label={`Eliminar cuenta ${c.nombre}`}
                      >
                        <TrashIcon className="w-3.5 h-3.5" /> Eliminar
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
