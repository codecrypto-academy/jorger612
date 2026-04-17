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
      <div data-testid="rol-table-loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ds-skeleton" />
        ))}
      </div>
    );
  }

  if (!roles.length) {
    return (
      <EmptyState
        title="Sin roles registrados"
        description="Crea el primer rol para comenzar a gestionar permisos en la blockchain."
        icon={<ShieldCheckIcon style={{ width: 48, height: 48 }} />}
      />
    );
  }

  return (
    <div className="ds-table-wrap" data-testid="rol-table">
      <table className="ds-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th className="ds-col-md-only">Ejecutor</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((rol) => (
            <tr key={rol.id}>
              <td style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-gray-600)', fontSize: 13 }}>#{rol.id}</td>
              <td style={{ fontWeight: 600 }}>{rol.nombre}</td>
              <td>
                <Badge activo={rol.activo} />
              </td>
              <td className="ds-col-md-only" style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 12, color: 'var(--ds-gray-600)' }}>
                {rol.ejecutor.slice(0, 8)}...{rol.ejecutor.slice(-6)}
              </td>
              <td>
                <div className="ds-table__actions">
                  <Button variant="ghost" size="sm" onClick={() => onHistorial(rol)} data-testid={`btn-historial-rol-${rol.id}`} aria-label={`Ver historial del rol ${rol.nombre}`}>
                    <ClockIcon style={{ width: 14, height: 14 }} /> Histórico
                  </Button>
                  {isOwner && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => onModificar(rol)} data-testid={`btn-modificar-rol-${rol.id}`} disabled={!rol.activo} aria-label={`Modificar rol ${rol.nombre}`}>
                        <PencilSquareIcon style={{ width: 14, height: 14 }} />
                        Modificar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onInhabilitar(rol)} data-testid={`btn-inhabilitar-rol-${rol.id}`} disabled={!rol.activo} aria-label={`Inhabilitar rol ${rol.nombre}`}>
                        <NoSymbolIcon style={{ width: 14, height: 14 }} />
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
