import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export function useGlobalFeed(limit = 50) {
  const { contract, provider } = useWeb3();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async () => {
    if (!contract || !provider) {
      setFeed([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const filter = contract.filters.DialogueAdded();
      const events = await contract.queryFilter(filter);
      const sorted = events
        .map((e) => ({
          sender: e.args?.sender ?? e.args[0],
          receiver: e.args?.receiver ?? e.args[1],
          timestamp: Number(e.args?.timestamp ?? e.args[2]),
          globalIndex: Number(e.args?.globalIndex ?? e.args[3]),
        }))
        .sort((a, b) => b.globalIndex - a.globalIndex)
        .slice(0, limit);

      const withMessages = await Promise.all(
        sorted.map(async (item) => {
          try {
            const [sender, receiver, timestamp, message] = await contract.getDialogue(item.globalIndex);
            return { sender, receiver, timestamp: Number(timestamp), message, globalIndex: item.globalIndex };
          } catch {
            return { ...item, message: '(no cargado)' };
          }
        })
      );
      setFeed(withMessages);
    } catch (err) {
      setError(err?.message || 'Error al cargar feed');
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }, [contract, provider, limit]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { feed, loading, error, refetch: fetchFeed };
}
