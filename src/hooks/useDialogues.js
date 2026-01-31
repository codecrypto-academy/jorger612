import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export function useDialogues(indices) {
  const { contract } = useWeb3();
  const [dialogues, setDialogues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDialogues = useCallback(async (indexList) => {
    if (!contract || !indexList?.length) {
      setDialogues([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        indexList.map(async (idx) => {
          const [sender, receiver, timestamp, message] = await contract.getDialogue(idx);
          return {
            index: idx,
            sender,
            receiver,
            timestamp: Number(timestamp),
            message,
          };
        })
      );
      setDialogues(results);
    } catch (err) {
      setError(err?.message || 'Error al cargar mensajes');
      setDialogues([]);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchDialogues(indices || []);
  }, [fetchDialogues, JSON.stringify(indices || [])]);

  return { dialogues, loading, error, refetch: () => fetchDialogues(indices) };
}
