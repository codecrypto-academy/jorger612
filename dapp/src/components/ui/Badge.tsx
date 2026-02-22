interface BadgeProps {
  activo: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function Badge({ activo, activeLabel = 'Activo', inactiveLabel = 'Inactivo' }: BadgeProps) {
  return (
    <span
      data-testid={activo ? 'badge-active' : 'badge-inactive'}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${
        activo
          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
          : 'bg-[#232A34] text-[#9CA3AF] border-[#2F3844]'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${activo ? 'bg-emerald-400 shadow-sm' : 'bg-[#6B7280]'}`} />
      {activo ? activeLabel : inactiveLabel}
    </span>
  );
}
