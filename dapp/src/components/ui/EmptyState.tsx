interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div data-testid="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center' }}>
      {icon && <div style={{ marginBottom: 16, color: 'var(--ds-gray-600)', opacity: 0.9 }}>{icon}</div>}
      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: 'var(--ds-text-title)' }}>{title}</p>
      <p style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--ds-gray-600)', maxWidth: 360, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}
