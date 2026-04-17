'use client';

import { Usuario, Rol } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { UsersIcon, PencilSquareIcon, NoSymbolIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface UsuarioTableProps {
  usuarios: Usuario[];
  roles: Rol[];
  loading: boolean;
  isOwner: boolean;
  onModificar: (u: Usuario) => void;
  onInhabilitar: (u: Usuario) => void;
  onHistorial: (u: Usuario) => void;
  onArbol?: (u: Usuario) => void;
}

export function UsuarioTable({ usuarios, roles, loading, isOwner, onModificar, onInhabilitar, onHistorial, onArbol }: UsuarioTableProps) {
  const getRolNombre = (rolId: number) => roles.find((r) => r.id === rolId)?.nombre ?? `Rol #${rolId}`;

  if (loading) {
    return (
      <div data-testid="usuario-table-loading">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ds-skeleton" />
        ))}
      </div>
    );
  }

  if (!usuarios.length) {
    return <EmptyState title="Sin usuarios registrados" description="Crea el primer usuario asignandole un rol activo." icon={<UsersIcon style={{ width: 48, height: 48 }} />} />;
  }

  const rolPill = (nombre: string) => (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        background: 'rgba(102, 126, 234, 0.12)',
        color: 'var(--ds-accent-start)',
        border: '1px solid rgba(102, 126, 234, 0.25)',
      }}
    >
      {nombre}
    </span>
  );

  return (
    <div className="ds-table-wrap" data-testid="usuario-table">
      <table className="ds-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Login</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 13, color: 'var(--ds-gray-600)' }}>#{u.id}</td>
              <td style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 600, color: 'var(--ds-accent-start)' }}>{u.login}</td>
              <td style={{ fontWeight: 600 }}>{u.nombre}</td>
              <td>{rolPill(getRolNombre(u.rolId))}</td>
              <td>
                <Badge activo={u.activo} />
              </td>
              <td>
                <div className="ds-table__actions">
                  {onArbol && (
                    <Button variant="gold" size="sm" onClick={() => onArbol(u)} data-testid={`btn-arbol-usuario-${u.id}`} aria-label={`Ver árbol de permisos de ${u.login}`}>
                      <ChartBarIcon style={{ width: 14, height: 14 }} /> Árbol
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onHistorial(u)} data-testid={`btn-historial-usuario-${u.id}`} aria-label={`Ver historial del usuario ${u.login}`}>
                    <ClockIcon style={{ width: 14, height: 14 }} /> Histórico
                  </Button>
                  {isOwner && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => onModificar(u)} data-testid={`btn-modificar-usuario-${u.id}`} disabled={!u.activo}>
                        <PencilSquareIcon style={{ width: 14, height: 14 }} /> Modificar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onInhabilitar(u)} data-testid={`btn-inhabilitar-usuario-${u.id}`} disabled={!u.activo}>
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
