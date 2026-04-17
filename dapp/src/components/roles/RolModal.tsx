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
    if (!trimmed) {
      setError('El nombre del rol es obligatorio.');
      return;
    }
    if (trimmed.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (trimmed.length > 64) {
      setError('El nombre no puede superar 64 caracteres.');
      return;
    }
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
      setError('Solo se permiten letras, numeros, espacios, guiones y guiones bajos.');
      return;
    }
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
        <div className="ds-field">
          <label htmlFor="rol-nombre" className="ds-label">
            Nombre del Rol <span style={{ color: 'var(--ds-danger)' }}>*</span>
          </label>
          <input
            id="rol-nombre"
            data-testid="input-rol-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Administrador, Auditor..."
            maxLength={64}
            className="ds-input"
            style={{ maxWidth: '100%' }}
            aria-required="true"
            aria-describedby={error ? 'rol-error' : undefined}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, alignItems: 'flex-start', gap: 8 }}>
            {error ? (
              <p id="rol-error" data-testid="rol-form-error" style={{ fontSize: 12, color: 'var(--ds-danger)', margin: 0 }}>
                {error}
              </p>
            ) : (
              <span />
            )}
            <p style={{ fontSize: 12, color: 'var(--ds-gray-600)', margin: 0 }}>{nombre.length}/64</p>
          </div>
        </div>

        {mode === 'modificar' && rol && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'var(--ds-bg-soft)',
              border: '1px solid var(--ds-border)',
              marginBottom: 8,
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--ds-gray-600)', margin: 0 }}>
              ID del Rol:{' '}
              <span style={{ fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-text-title)', fontWeight: 600 }}>#{rol.id}</span>
            </p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <div style={{ flex: 1 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ width: '100%' }}>
              Cancelar
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button type="submit" loading={loading} data-testid="btn-submit-rol" style={{ width: '100%' }}>
              {loading ? 'Procesando...' : mode === 'crear' ? 'Crear Rol' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
