'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CuentaAutorizada } from '@/types';

function isValidAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

interface CuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (wallet: string, nombre: string) => Promise<void>;
  cuenta?: CuentaAutorizada | null;
  mode: 'crear' | 'modificar';
}

export function CuentaModal({ isOpen, onClose, onSubmit, cuenta, mode }: CuentaModalProps) {
  const [wallet, setWallet] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWallet(mode === 'modificar' && cuenta ? cuenta.wallet : '');
      setNombre(mode === 'modificar' && cuenta ? cuenta.nombre : '');
      setError('');
    }
  }, [isOpen, cuenta, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNombre = nombre.trim();
    const trimmedWallet = wallet.trim();
    if (mode === 'crear') {
      if (!trimmedWallet) { setError('La direccion de la wallet es obligatoria.'); return; }
      if (!isValidAddress(trimmedWallet)) { setError('Direccion de wallet invalida (debe ser 0x + 40 hex).'); return; }
    }
    if (!trimmedNombre) { setError('El nombre es obligatorio.'); return; }
    if (trimmedNombre.length < 2) { setError('El nombre debe tener al menos 2 caracteres.'); return; }
    if (trimmedNombre.length > 64) { setError('El nombre no puede superar 64 caracteres.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(mode === 'crear' ? trimmedWallet : cuenta!.wallet, trimmedNombre);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la transaccion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'crear' ? 'Crear Cuenta Autorizada' : 'Modificar Cuenta'}>
      <form onSubmit={handleSubmit} data-testid="cuenta-form" noValidate>
        <div className="space-y-4">
          {mode === 'crear' ? (
            <div>
              <label htmlFor="cuenta-wallet" className="block text-sm font-medium text-slate-300 mb-1.5">
                Direccion de la wallet <span className="text-red-400">*</span>
              </label>
              <input
                id="cuenta-wallet"
                data-testid="input-cuenta-wallet"
                type="text"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-[#191D24] border border-[#232A34] rounded-xl text-[#FAFBFC] placeholder-[#6B7280] font-mono text-sm focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all duration-300"
                aria-required="true"
              />
            </div>
          ) : (
            <div className="px-4 py-3 bg-[#191D24] rounded-xl border border-[#232A34]">
              <p className="text-xs text-slate-400">Wallet: <span className="text-slate-200 font-mono break-all">{cuenta?.wallet}</span></p>
            </div>
          )}

          <div>
            <label htmlFor="cuenta-nombre" className="block text-sm font-medium text-slate-300 mb-1.5">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              id="cuenta-nombre"
              data-testid="input-cuenta-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Perez, Admin..."
              maxLength={64}
              className="w-full px-4 py-3 bg-[#191D24] border border-[#232A34] rounded-xl text-[#FAFBFC] placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20 transition-all duration-300"
              aria-required="true"
              aria-describedby={error ? 'cuenta-error' : undefined}
            />
            <div className="flex justify-between mt-1">
              {error
                ? <p id="cuenta-error" data-testid="cuenta-form-error" className="text-xs text-red-400">{error}</p>
                : <span />}
              <p className="text-xs text-slate-500">{nombre.length}/64</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} className="flex-1" data-testid="btn-submit-cuenta">
            {loading ? 'Procesando...' : mode === 'crear' ? 'Crear Cuenta' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
