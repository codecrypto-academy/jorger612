'use client';

import { Modal } from '@/components/ui/Modal';
import { HistorialItem } from '@/hooks/useHistorial';

interface HistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo: string;
  items: HistorialItem[];
  loading: boolean;
}

function formatFechaHora(timestamp: number): string {
  if (!timestamp) return '—';
  const d = new Date(timestamp * 1000);
  return d.toLocaleString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function HistorialModal({ isOpen, onClose, titulo, subtitulo, items, loading }: HistorialModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo} size="lg">
      <p className="ds-muted" style={{ marginTop: 0, marginBottom: 16 }}>
        {subtitulo}
      </p>

      {loading ? (
        <div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="ds-skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--ds-gray-600)', margin: 0 }}>No hay movimientos registrados.</p>
      ) : (
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Acción</th>
                <th>Detalle</th>
                <th>Ejecutor</th>
                <th>Fecha y hora</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{item.accion}</td>
                  <td style={{ color: 'var(--ds-gray-600)' }}>{item.detalle ?? '—'}</td>
                  <td style={{ fontFamily: 'var(--ds-font-mono)', fontSize: 12, color: 'var(--ds-gray-600)' }}>{formatAddress(item.ejecutor)}</td>
                  <td style={{ color: 'var(--ds-gray-600)', whiteSpace: 'nowrap' }}>{formatFechaHora(item.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button type="button" onClick={onClose} className="ds-btn ds-btn--secondary" style={{ width: '100%', marginTop: 20, textTransform: 'none' }}>
        Cerrar
      </button>
    </Modal>
  );
}
