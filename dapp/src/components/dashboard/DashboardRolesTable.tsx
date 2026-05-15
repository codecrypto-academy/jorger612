'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { RolDashboardRow } from '@/hooks/useDashboardData';
import { MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';

const PAGE_SIZE = 5;

interface DashboardRolesTableProps {
  roles: RolDashboardRow[];
  loading: boolean;
}

function formatFecha(ts: number): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DashboardRolesTable({ roles, loading }: DashboardRolesTableProps) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return roles;
    return roles.filter((r) => r.nombre.toLowerCase().includes(term) || String(r.id).includes(term));
  }, [roles, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section className="ds-panel">
      <div className="ds-panel__head">
        <div>
          <h2 className="ds-panel__title">Roles</h2>
          <p className="ds-panel__desc">Administra los roles del sistema y sus permisos asociados.</p>
        </div>
        <Link href="/roles">
          <Button size="sm">+ Nuevo rol</Button>
        </Link>
      </div>

      <div className="ds-panel__toolbar">
        <div className="ds-search">
          <MagnifyingGlassIcon style={{ width: 18, height: 18, color: 'var(--ds-gray-600)' }} />
          <input
            type="search"
            placeholder="Buscar roles..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            aria-label="Buscar roles"
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '1rem 0' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ds-skeleton" style={{ marginBottom: 8 }} />
          ))}
        </div>
      ) : slice.length === 0 ? (
        <p className="ds-muted" style={{ padding: '2rem 0', textAlign: 'center', margin: 0 }}>
          No hay roles que mostrar.
        </p>
      ) : (
        <div className="ds-table-wrap">
          <table className="ds-table ds-table--dashboard">
            <thead>
              <tr>
                <th>Rol</th>
                <th>Usuarios</th>
                <th>Vínculos menú</th>
                <th>Estado</th>
                <th>Última actualización</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((rol) => (
                <tr key={rol.id}>
                  <td>
                    <div className="ds-role-cell">
                      <span className="ds-role-cell__icon">
                        <ShieldCheckIcon style={{ width: 18, height: 18 }} />
                      </span>
                      <span>
                        <strong>{rol.nombre}</strong>
                        <span className="ds-muted" style={{ display: 'block', fontSize: 12, fontWeight: 400 }}>
                          ID #{rol.id}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>{rol.usuariosCount}</td>
                  <td>{rol.vinculosCount}</td>
                  <td>
                    <span className={`ds-status-pill${rol.activo ? ' ds-status-pill--ok' : ' ds-status-pill--warn'}`}>
                      {rol.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--ds-gray-600)' }}>
                    {formatFecha(rol.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="ds-table-footer">
          <span>
            {((safePage - 1) * PAGE_SIZE + 1).toLocaleString('es')} a{' '}
            {Math.min(safePage * PAGE_SIZE, filtered.length).toLocaleString('es')} de {filtered.length.toLocaleString('es')}{' '}
            roles
          </span>
          <div className="ds-pagination">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={p === safePage ? 'is-active' : undefined}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              ›
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
