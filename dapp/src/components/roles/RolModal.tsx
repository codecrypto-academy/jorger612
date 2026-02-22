'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Rol } from '@/types';

interface RolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nombre: string) => Promise<void>;
  rol?: Rol | null;
  mode: 'crear' | 'modificar';
}

export function RolModal({ isOpen, onClose, onSubmit, rol, mode }: RolModalProps) {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNombre(mode === 'modificar' && rol ? rol.nombre : '');
      setError('');
    }
  }, [isOpen, rol, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) { setError('El nombre del rol es obligatorio.'); return; }
    if (trimmed.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (trimmed.length > 64) { setError('El nombre no puede superar 64 caracteres.'); return; }
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) { setError('Solo se permiten letras, numeros, espacios, guiones y guiones bajos.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la transaccion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'crear' ? 'Crear Nuevo Rol' : 'Modificar Rol'}>
      <form onSubmit={handleSubmit} data-testid="rol-form" noValidate>
        <div className="space-y-4">
          <div>
            <label htmlFor="rol-nombre" className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre del Rol <span className="text-red-400">*</span>
            </label>
            <input
              id="rol-nombre"
              data-testid="input-rol-nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Administrador, Auditor..."
              maxLength={64}
              className="w-full px-4 py-3 bg-[#191D24] border border-[#232A34] rounded-xl text-[#FAFBFC] placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all duration-300"
              aria-required="true"
              aria-describedby={error ? 'rol-error' : undefined}
            />
            <div className="flex justify-between mt-1">
              {error
                ? <p id="rol-error" data-testid="rol-form-error" className="text-xs text-red-400">{error}</p>
                : <span />
              }
              <p className="text-xs text-slate-500">{nombre.length}/64</p>
            </div>
          </div>

          {mode === 'modificar' && rol && (
            <div className="px-4 py-3 bg-[#191D24] rounded-xl border border-[#232A34]">
              <p className="text-xs text-slate-400">ID del Rol: <span className="text-slate-200 font-mono">#{rol.id}</span></p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1" data-testid="btn-submit-rol">
            {loading ? 'Procesando...' : mode === 'crear' ? 'Crear Rol' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
