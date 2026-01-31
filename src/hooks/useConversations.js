import { useMemo } from 'react';
import { useParticipantIndices } from './useParticipantIndices';
import { useDialogues } from './useDialogues';
import { useWeb3 } from '../context/Web3Context';

export function useConversations() {
  const { address } = useWeb3();
  const { indices, loading: indicesLoading, error: indicesError, refetch: refetchIndices } = useParticipantIndices();
  const { dialogues, loading: dialoguesLoading, refetch: refetchDialogues } = useDialogues(indices);

  const conversations = useMemo(() => {
    if (!address || !dialogues.length) return [];
    const byPeer = new Map();
    for (const d of dialogues) {
      const peer = d.sender.toLowerCase() === address.toLowerCase() ? d.receiver : d.sender;
      const key = peer.toLowerCase();
      if (!byPeer.has(key)) {
        byPeer.set(key, { peer, messages: [], lastTimestamp: 0 });
      }
      const entry = byPeer.get(key);
      entry.messages.push(d);
      if (d.timestamp > entry.lastTimestamp) entry.lastTimestamp = d.timestamp;
    }
    return Array.from(byPeer.values())
      .map((c) => ({ ...c, messages: c.messages.sort((a, b) => a.timestamp - b.timestamp) }))
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }, [address, dialogues]);

  const loading = indicesLoading || dialoguesLoading;
  const refetch = () => {
    refetchIndices();
    refetchDialogues();
  };

  return { conversations, loading, error: indicesError, refetch };
}
