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
      <div data-testid="cuenta-table-loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ds-skeleton" />
        ))}
      </div>
    );
  }

  if (!cuentas.length) {
    return (
      <EmptyState
        title="Sin cuentas autorizadas"
        description="Solo el propietario del contrato puede crear cuentas autorizadas."
        icon={<UserGroupIcon style={{ width: 48, height: 48 }} />}
      />
    );
  }

  return (
    <div className="ds-table-wrap" data-testid="cuenta-table">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Wallet</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cuentas.map((c) => (
            <tr key={c.wallet}>
              <td style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 12, color: 'var(--ds-gray-600)' }}>
                {c.wallet.slice(0, 10)}...{c.wallet.slice(-8)}
              </td>
              <td style={{ fontWeight: 600 }}>{c.nombre}</td>
              <td>
                <Badge activo={c.activa} activeLabel="Activa" inactiveLabel="Inactiva" />
              </td>
              <td>
                <div className="ds-table__actions">
                  {isOwner && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onModificar(c)}
                        data-testid={`btn-modificar-cuenta-${c.wallet.slice(-6)}`}
                        aria-label={`Modificar cuenta ${c.nombre}`}
                      >
                        <PencilSquareIcon style={{ width: 14, height: 14 }} /> Modificar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onEliminar(c)}
                        data-testid={`btn-eliminar-cuenta-${c.wallet.slice(-6)}`}
                        aria-label={`Eliminar cuenta ${c.nombre}`}
                      >
                        <TrashIcon style={{ width: 14, height: 14 }} /> Eliminar
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
