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
  const getRolNombre = (rolId: number) => roles.find(r => r.id === rolId)?.nombre ?? `Rol #${rolId}`;

  if (loading) return <div data-testid="usuario-table-loading" className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-[#191D24] rounded-xl animate-pulse" />)}</div>;

  if (!usuarios.length) return <EmptyState title="Sin usuarios registrados" description="Crea el primer usuario asignandole un rol activo." icon={<UsersIcon className="w-12 h-12" />} />;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#232A34] bg-[#0D0F12] shadow-xl shadow-black/30" data-testid="usuario-table">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#232A34] bg-[#191D24]">
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">ID</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Login</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Nombre</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Rol</th>
            <th className="px-5 py-4 text-left text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Estado</th>
            <th className="px-5 py-4 text-right text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232A34]">
          {usuarios.map(u => (
            <tr key={u.id} className="hover:bg-[#191D24]/50 transition-colors duration-300">
              <td className="px-5 py-4 font-mono text-[#6B7280]">#{u.id}</td>
              <td className="px-5 py-4 font-mono text-[#D4AF37] text-sm">{u.login}</td>
              <td className="px-5 py-4 font-medium text-[#FAFBFC]">{u.nombre}</td>
              <td className="px-5 py-4"><span className="px-2.5 py-1 rounded-lg bg-[#C9A227]/15 text-[#D4AF37] text-xs border border-[#C9A227]/30">{getRolNombre(u.rolId)}</span></td>
              <td className="px-5 py-4"><Badge activo={u.activo} /></td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  {onArbol && (
                    <Button variant="gold" size="sm" onClick={() => onArbol(u)} data-testid={`btn-arbol-usuario-${u.id}`} aria-label={`Ver árbol de permisos de ${u.login}`}>
                      <ChartBarIcon className="w-3.5 h-3.5" /> Árbol
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onHistorial(u)} data-testid={`btn-historial-usuario-${u.id}`} aria-label={`Ver historial del usuario ${u.login}`}>
                    <ClockIcon className="w-3.5 h-3.5" /> Histórico
                  </Button>
                  {isOwner && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => onModificar(u)} data-testid={`btn-modificar-usuario-${u.id}`} disabled={!u.activo}>
                        <PencilSquareIcon className="w-3.5 h-3.5" /> Modificar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onInhabilitar(u)} data-testid={`btn-inhabilitar-usuario-${u.id}`} disabled={!u.activo}>
                        <NoSymbolIcon className="w-3.5 h-3.5" /> Inhabilitar
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
