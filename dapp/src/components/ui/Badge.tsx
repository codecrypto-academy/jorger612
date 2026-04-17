interface BadgeProps {
  activo: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function Badge({ activo, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }: BadgeProps) {
  return (
    <span
      data-testid={activo ? 'badge-active' : 'badge-inactive'}
      className={`ds-badge${activo ? ' ds-badge--success' : ''}`}
      style={
        activo
          ? undefined
          : {
              background: 'var(--ds-bg-soft-2)',
              color: 'var(--ds-gray-700)',
              border: '1px solid var(--ds-border)',
            }
      }
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: activo ? '#28a745' : 'var(--ds-gray-600)',
          flexShrink: 0,
        }}
      />
      {activo ? activeLabel : inactiveLabel}
    </span>
  );
}
