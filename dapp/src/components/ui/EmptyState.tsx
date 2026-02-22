interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div data-testid="empty-state" className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-5 text-[#6B7280] opacity-80">{icon}</div>}
      <p className="text-[#E5E7EB] font-medium text-[15px]">{title}</p>
      <p className="text-sm text-[#6B7280] mt-2 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}
