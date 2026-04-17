'use client';

import { Menu } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Squares2X2Icon, PencilSquareIcon, NoSymbolIcon, LinkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MenuTableProps {
  menus: Menu[];
  loading: boolean;
  isOwner: boolean;
  onModificar: (m: Menu) => void;
  onInhabilitar: (m: Menu) => void;
  onAsociarRol: (m: Menu) => void;
  onHistorial: (m: Menu) => void;
}

export function MenuTable({ menus, loading, isOwner, onModificar, onInhabilitar, onAsociarRol, onHistorial }: MenuTableProps) {
  if (loading) {
    return (
      <div data-testid="menu-table-loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ds-skeleton" />
        ))}
      </div>
    );
  }

  if (!menus.length) {
    return <EmptyState title="Sin menus registrados" description="Crea el primer menu y asocia roles de acceso." icon={<Squares2X2Icon style={{ width: 48, height: 48 }} />} />;
  }

  return (
    <div className="ds-table-wrap" data-testid="menu-table">
      <table className="ds-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {menus.map((m) => (
            <tr key={m.id}>
              <td style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 13, color: 'var(--ds-gray-600)' }}>#{m.id}</td>
              <td style={{ fontWeight: 600 }}>{m.nombre}</td>
              <td>
                <Badge activo={m.activo} />
              </td>
              <td>
                <div className="ds-table__actions">
                  <Button variant="ghost" size="sm" onClick={() => onHistorial(m)} data-testid={`btn-historial-menu-${m.id}`} aria-label={`Ver historial del menu ${m.nombre}`}>
                    <ClockIcon style={{ width: 14, height: 14 }} /> Histórico
                  </Button>
                  {isOwner && (
                    <>
                      <Button variant="gold" size="sm" onClick={() => onAsociarRol(m)} data-testid={`btn-asociar-rol-${m.id}`} aria-label={`Asociar roles a menu ${m.nombre}`}>
                        <LinkIcon style={{ width: 14, height: 14 }} /> Roles
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => onModificar(m)} data-testid={`btn-modificar-menu-${m.id}`} disabled={!m.activo}>
                        <PencilSquareIcon style={{ width: 14, height: 14 }} /> Modificar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onInhabilitar(m)} data-testid={`btn-inhabilitar-menu-${m.id}`} disabled={!m.activo}>
                        <NoSymbolIcon style={{ width: 14, height: 14 }} /> Inhabilitar
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
