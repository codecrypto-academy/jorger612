import { useConversations } from '../hooks/useConversations';
import { formatAddress, formatTimestamp } from '../utils/format';

export function Inbox({ selectedPeer, onSelectPeer }) {
  const { conversations, loading, error } = useConversations();

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (loading && !conversations.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-elite-gold/50 border-t-elite-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="py-8 text-center text-elite-silver text-sm">
        No hay conversaciones. Envia un mensaje para empezar.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-elite-accent/30">
      {conversations.map(({ peer, messages, lastTimestamp }) => {
        const lastMsg = messages[messages.length - 1];
        const isSelected = selectedPeer?.toLowerCase() === peer.toLowerCase();
        return (
          <li key={peer}>
            <button
              type="button"
              onClick={() => onSelectPeer(peer)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                isSelected
                  ? 'bg-elite-gold/15 border-l-2 border-elite-gold'
                  : 'hover:bg-elite-slate/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-elite-accent flex items-center justify-center text-premium-pearl font-mono text-xs flex-shrink-0">
                {formatAddress(peer).slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-premium-pearl truncate font-mono text-sm">
                  {formatAddress(peer)}
                </p>
                <p className="text-elite-silver text-xs truncate mt-0.5">
                  {lastMsg?.message || '-'}
                </p>
              </div>
              <span className="text-elite-silver/80 text-xs flex-shrink-0">
                {formatTimestamp(lastTimestamp)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
