import { useGlobalFeed } from '../hooks/useGlobalFeed';
import { formatAddress, formatTimestamp } from '../utils/format';

export function GlobalFeed() {
  const { feed, loading, error, refetch } = useGlobalFeed(30);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-elite-accent/20 bg-elite-charcoal/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-elite-accent/20 bg-elite-slate/30 flex items-center justify-between">
        <h3 className="font-display font-semibold text-premium-pearl text-lg">
          Feed global
        </h3>
        <button
          type="button"
          onClick={refetch}
          disabled={loading}
          className="text-xs text-elite-gold hover:text-elite-gold/80 disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-4 space-y-3">
        {loading && !feed.length ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-elite-gold/50 border-t-elite-gold rounded-full animate-spin" />
          </div>
        ) : !feed.length ? (
          <p className="text-elite-silver text-sm text-center py-6">
            Aun no hay mensajes en la red.
          </p>
        ) : (
          feed.map((item) => (
            <div
              key={item.globalIndex}
              className="rounded-lg bg-elite-slate/50 border border-elite-accent/20 p-3 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-xs text-elite-silver mb-1">
                <span className="font-mono">{formatAddress(item.sender)}</span>
                <span>→</span>
                <span className="font-mono">{formatAddress(item.receiver)}</span>
                <span className="ml-auto">{formatTimestamp(item.timestamp)}</span>
              </div>
              <p className="text-premium-pearl/95 text-sm whitespace-pre-wrap break-words">
                {item.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
