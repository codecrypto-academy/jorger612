import { useMemo } from 'react';
import { useConversations } from '../hooks/useConversations';
import { formatAddress, formatTimestamp } from '../utils/format';
import { useWeb3 } from '../context/Web3Context';

export function ChatView({ selectedPeer }) {
  const { address } = useWeb3();
  const { conversations } = useConversations();

  const messages = useMemo(() => {
    if (!selectedPeer || !conversations.length) return [];
    const conv = conversations.find(
      (c) => c.peer.toLowerCase() === selectedPeer.toLowerCase()
    );
    return conv?.messages ?? [];
  }, [conversations, selectedPeer]);

  if (!selectedPeer) {
    return (
      <div className="flex-1 flex items-center justify-center text-elite-silver text-sm bg-elite-charcoal/50 rounded-xl border border-elite-accent/20">
        Selecciona una conversación del panel izquierdo
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-elite-charcoal/50 rounded-xl border border-elite-accent/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-elite-accent/20 bg-elite-slate/30">
        <p className="font-mono text-sm text-premium-pearl font-medium">
          {formatAddress(selectedPeer)}
        </p>
        <p className="text-elite-silver text-xs mt-0.5">{selectedPeer}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender.toLowerCase() === address?.toLowerCase();
          return (
            <div
              key={`${msg.index}-${msg.timestamp}`}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? 'bg-elite-gold/25 border border-elite-gold/40 text-premium-pearl'
                    : 'bg-elite-slate border border-elite-accent/30 text-premium-pearl/95'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    isMe ? 'text-elite-gold/80' : 'text-elite-silver/70'
                  }`}
                >
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
