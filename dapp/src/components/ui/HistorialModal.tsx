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

export function HistorialModal({
  isOpen,
  onClose,
  titulo,
  subtitulo,
  items,
  loading,
}: HistorialModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titulo} size="lg">
      <p className="text-sm text-slate-400 mb-4">{subtitulo}</p>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[#191D24] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No hay movimientos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#232A34] text-left">
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acción</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Detalle</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ejecutor</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fecha y hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232A34]">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#191D24]/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#FAFBFC]">{item.accion}</td>
                  <td className="px-4 py-3 text-slate-400">{item.detalle ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{formatAddress(item.ejecutor)}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatFechaHora(item.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-6 w-full py-2.5 rounded-xl bg-[#191D24] border border-[#232A34] text-sm font-medium text-white hover:bg-[#232A34] transition-colors"
      >
        Cerrar
      </button>
    </Modal>
  );
}
