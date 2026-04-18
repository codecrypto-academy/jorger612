'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Button } from '@/components/ui/Button';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export type MarketLeadStatus = 'Pendiente' | 'Enviado' | 'Anulado';

export interface MarketLeadRow {
  id: string;
  walletAddress: string;
  nombreApellido: string;
  email: string;
  telefono: string;
  descripcionAplicacion: string;
  status: MarketLeadStatus;
  createdAt: string;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function rowMatches(row: MarketLeadRow, q: string) {
  const hay = q.trim().toLowerCase();
  if (!hay) return true;
  const blob = [
    row.id,
    row.walletAddress,
    row.nombreApellido,
    row.email,
    row.telefono,
    row.descripcionAplicacion,
    row.status,
    formatDate(row.createdAt),
  ]
    .join(' ')
    .toLowerCase();
  return blob.includes(hay);
}

function statusBadgeClass(status: MarketLeadStatus) {
  if (status === 'Pendiente') return 'ds-badge ds-badge--info';
  if (status === 'Enviado') return 'ds-badge ds-badge--success';
  return 'ds-badge ds-badge--error';
}

export default function PeticionesPage() {
  const { isConnected, account, isOwner } = useWallet();
  const [items, setItems] = useState<MarketLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!account || !isOwner) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/market/leads`, {
        headers: { 'X-Owner-Address': account },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo cargar el listado.');
        setItems([]);
        return;
      }
      const raw = (data.items ?? []) as MarketLeadRow[];
      setItems(
        raw.map((r) => ({
          ...r,
          status: (r.status as MarketLeadStatus) ?? 'Pendiente',
        })),
      );
    } catch {
      setError('Error de red al cargar las peticiones.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [account, isOwner]);

  useEffect(() => {
    if (isConnected && isOwner && account) {
      load();
    } else {
      setLoading(false);
      setItems([]);
    }
  }, [isConnected, isOwner, account, load]);

  const filtered = useMemo(
    () => items.filter((row) => rowMatches(row, search)),
    [items, search],
  );

  const patchStatus = async (id: string, status: 'Enviado' | 'Anulado') => {
    if (!account) return;
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/market/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: account, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.message === 'string' ? data.message : 'No se pudo actualizar.');
        return;
      }
      await load();
    } catch {
      setError('Error de red al actualizar.');
    } finally {
      setActionId(null);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ animation: 'dsFadeIn 0.35s ease' }}>
        <div className="ds-alert ds-alert--info" role="status">
          Conecte su wallet para acceder a esta sección.
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div style={{ animation: 'dsFadeIn 0.35s ease' }}>
        <div className="ds-alert ds-alert--danger" role="alert">
          Solo el owner del contrato puede ver y gestionar las peticiones del formulario Market.
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'dsFadeIn 0.35s ease' }}>
      <div className="ds-card" style={{ marginBottom: 20 }}>
        <h2 className="ds-card__title" style={{ color: 'var(--ds-text-title)' }}>
          Peticiones Market
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
          Gestione las solicitudes enviadas desde el formulario: marque como enviado o anule según corresponda.
        </p>

        <div className="ds-field" style={{ marginBottom: 0 }}>
          <label className="ds-label" htmlFor="peticiones-search" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MagnifyingGlassIcon style={{ width: 18, height: 18, color: 'var(--ds-accent-start)' }} />
            Buscar
          </label>
          <input
            id="peticiones-search"
            type="search"
            className="ds-input"
            style={{ maxWidth: '100%' }}
            placeholder="Filtra por wallet, correo, nombre, teléfono, estado…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {error && (
        <div className="ds-alert ds-alert--danger" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="ds-card">
          <div className="ds-skeleton" />
          <div className="ds-skeleton" />
          <div className="ds-skeleton" />
        </div>
      ) : (
        <>
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 13,
              color: 'var(--ds-gray-600)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ marginRight: 8 }} aria-hidden>
              ↔
            </span>
            Desplácese con la <strong style={{ color: 'var(--ds-accent-start)' }}>barra horizontal debajo de la tabla</strong> para ver{' '}
            <strong>Estado</strong> y los botones de acción.
          </p>
          <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Wallet</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ color: 'var(--ds-gray-600)', textAlign: 'center', padding: 24 }}>
                    {items.length === 0 ? 'No hay peticiones registradas.' : 'Ninguna fila coincide con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{formatDate(row.createdAt)}</td>
                    <td>
                      <span className="ds-code" style={{ fontSize: 12 }}>
                        {row.walletAddress}
                      </span>
                    </td>
                    <td>{row.nombreApellido || '—'}</td>
                    <td>{row.email}</td>
                    <td>{row.telefono || '—'}</td>
                    <td style={{ maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.descripcionAplicacion}>
                        {row.descripcionAplicacion || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={statusBadgeClass(row.status)}>{row.status}</span>
                    </td>
                    <td>
                      <div className="ds-table__actions">
                        {row.status === 'Pendiente' && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            loading={actionId === row.id}
                            disabled={actionId !== null}
                            onClick={() => patchStatus(row.id, 'Enviado')}
                          >
                            Marcar enviado
                          </Button>
                        )}
                        {row.status !== 'Anulado' && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            loading={actionId === row.id}
                            disabled={actionId !== null}
                            onClick={() => patchStatus(row.id, 'Anulado')}
                          >
                            Anular
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
