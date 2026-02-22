'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AlertaCuentaNoAutorizadaProps {
  className?: string;
}

export function AlertaCuentaNoAutorizada({ className = '' }: AlertaCuentaNoAutorizadaProps) {
  return (
    <div
      role="alert"
      className={`px-5 py-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-start gap-3 ${className}`}
      data-testid="alerta-cuenta-no-autorizada"
    >
      <ExclamationTriangleIcon className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-200">
          Cuenta no registrada
        </p>
        <p className="text-sm text-amber-100/90 mt-1 leading-relaxed">
          Tu dirección no está registrada en el sistema. Debes comunicarte con el administrador para que pueda darte de alta como cuenta autorizada y así poder gestionar roles, usuarios y menús.
        </p>
      </div>
    </div>
  );
}
