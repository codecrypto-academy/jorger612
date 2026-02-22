'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Usuario, Rol } from '@/types';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (login: string, nombre: string, rolId: number) => Promise<void>;
  usuario?: Usuario | null;
  roles: Rol[];
  mode: 'crear' | 'modificar';
}

export function UsuarioModal({ isOpen, onClose, onSubmit, usuario, roles, mode }: UsuarioModalProps) {
  const [login, setLogin] = useState('');
  const [nombre, setNombre] = useState('');
  const [rolId, setRolId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rolesActivos = roles.filter(r => r.activo);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'modificar' && usuario) {
        setLogin(usuario.login);
        setNombre(usuario.nombre);
        setRolId(usuario.rolId);
      } else {
        setLogin(''); setNombre(''); setRolId(rolesActivos[0]?.id ?? 0);
      }
      setError('');
    }
  }, [isOpen, usuario, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tLogin = login.trim();
    const tNombre = nombre.trim();
    if (!tLogin) { setError('El login es obligatorio.'); return; }
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(tLogin)) { setError('Login: 3-32 chars, solo letras, numeros, punto, guion.'); return; }
    if (!tNombre || tNombre.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!rolId) { setError('Debes seleccionar un rol.'); return; }
    setLoading(true); setError('');
    try {
      await onSubmit(tLogin, tNombre, rolId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la transaccion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'crear' ? 'Crear Usuario' : 'Modificar Usuario'}>
      <form onSubmit={handleSubmit} data-testid="usuario-form" noValidate>
        <div className="space-y-4">
          <div>
            <label htmlFor="u-login" className="block text-sm font-medium text-slate-300 mb-1.5">Login <span className="text-red-400">*</span></label>
            <input id="u-login" data-testid="input-usuario-login" type="text" value={login} onChange={e => setLogin(e.target.value)} placeholder="usuario.nombre" maxLength={32}
              className="w-full px-3.5 py-2.5 bg-[#191D24] border border-[#232A34] rounded-xl text-[#FAFBFC] placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all duration-300" />
          </div>
          <div>
            <label htmlFor="u-nombre" className="block text-sm font-medium text-slate-300 mb-1.5">Nombre Completo <span className="text-red-400">*</span></label>
            <input id="u-nombre" data-testid="input-usuario-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Perez" maxLength={64}
              className="w-full px-3.5 py-2.5 bg-[#191D24] border border-[#232A34] rounded-xl text-[#FAFBFC] placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all duration-300" />
          </div>
          <div>
            <label htmlFor="u-rol" className="block text-sm font-medium text-slate-300 mb-1.5">Rol Asignado <span className="text-red-400">*</span></label>
            <select id="u-rol" data-testid="select-usuario-rol" value={rolId} onChange={e => setRolId(Number(e.target.value))}
              className="w-full px-4 py-3 bg-[#191D24] border border-[#232A34] rounded-xl text-[#FAFBFC] text-sm focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all duration-300">
              <option value={0}>-- Selecciona un rol --</option>
              {rolesActivos.map(r => <option key={r.id} value={r.id}>#{r.id} {r.nombre}</option>)}
            </select>
            {rolesActivos.length === 0 && <p className="text-xs text-amber-400 mt-1">No hay roles activos disponibles.</p>}
          </div>
          {error && <p data-testid="usuario-form-error" className="text-xs text-red-300 font-medium bg-red-950/40 px-3 py-2 rounded-lg border-2 border-red-500/50">{error}</p>}
          {mode === 'modificar' && usuario && (
            <div className="px-4 py-3 bg-[#191D24] rounded-xl border border-[#232A34]">
              <p className="text-xs text-slate-400">ID: <span className="text-slate-200 font-mono">#{usuario.id}</span></p>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1" data-testid="btn-submit-usuario">
            {loading ? 'Procesando...' : mode === 'crear' ? 'Crear Usuario' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
