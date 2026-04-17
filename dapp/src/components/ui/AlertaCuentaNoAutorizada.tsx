'use client';

import type { CSSProperties } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AlertaCuentaNoAutorizadaProps {
  className?: string;
  style?: CSSProperties;
}

export function AlertaCuentaNoAutorizada({ className = '', style }: AlertaCuentaNoAutorizadaProps) {
  return (
    <div
      role="alert"
      className={`ds-alert ds-alert--warning ${className}`.trim()}
      style={style}
      data-testid="alerta-cuenta-no-autorizada"
    >
      <ExclamationTriangleIcon style={{ width: 24, height: 24, flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Acceso restringido — cuenta no registrada</p>
        <p style={{ margin: '8px 0 0', fontSize: 14, lineHeight: 1.6 }}>
          Tu dirección de wallet no está registrada como cuenta autorizada en el contrato. Para poder gestionar roles, usuarios y menús necesitas:
        </p>
        <ul style={{ margin: '10px 0 0', paddingLeft: '1.25rem', fontSize: 14, lineHeight: 1.6 }}>
          <li>Que el administrador del contrato registre tu dirección en <strong>Gestionar Cuentas</strong>.</li>
          <li>Que la cuenta esté marcada como <strong>activa</strong>.</li>
        </ul>
        <p style={{ fontSize: 12, margin: '12px 0 0', fontFamily: 'var(--ds-font-mono)', wordBreak: 'break-all' }}>
          Si eres el owner del contrato, ve a <strong>Gestionar Cuentas</strong> y añade tu propia dirección.
        </p>
      </div>
    </div>
  );
}
