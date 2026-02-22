'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/types';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nombre: string) => Promise<void>;
  menu?: Menu | null;
  mode: 'crear' | 'modificar';
}

export function MenuModal({ isOpen, onClose, onSubmit, menu, mode }: MenuModalProps) {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setNombre(mode === 'modificar' && menu ? menu.nombre : ''); setError(''); }
  }, [isOpen, menu, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) { setError('El nombre del menu es obligatorio.'); return; }
    if (trimmed.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (trimmed.length > 64) { setError('Maximo 64 caracteres.'); return; }
    if (!/^[a-zA-Z0-9\s_\-\/]+$/.test(trimmed)) { setError('Solo letras, numeros, espacios, guiones y barras.'); return; }
    setLoading(true); setError('');
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la transaccion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'crear' ? 'Crear Menu' : 'Modificar Menu'}>
      <form onSubmit={handleSubmit} data-testid="menu-form" noValidate>
        <div className="space-y-4">
          <div>
            <label htmlFor="menu-nombre" className="block text-sm font-medium text-slate-300 mb-1.5">Nombre del Menu <span className="text-red-400">*</span></label>
            <input id="menu-nombre" data-testid="input-menu-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Dashboard, Reportes/Ventas..." maxLength={64}
              className="w-full px-4 py-3 bg-[#191D24] border border-[#232A34] rounded-xl text-[#FAFBFC] placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all duration-300" />
            <div className="flex justify-between mt-1">
              {error ? <p data-testid="menu-form-error" className="text-xs text-red-300 font-medium">{error}</p> : <span />}
              <p className="text-xs text-slate-500">{nombre.length}/64</p>
            </div>
          </div>
          {mode === 'modificar' && menu && (
            <div className="px-4 py-3 bg-[#191D24] rounded-xl border border-[#232A34]">
              <p className="text-xs text-slate-400">ID: <span className="font-mono text-slate-200">#{menu.id}</span></p>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1" data-testid="btn-submit-menu">
            {loading ? 'Procesando...' : mode === 'crear' ? 'Crear Menu' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
