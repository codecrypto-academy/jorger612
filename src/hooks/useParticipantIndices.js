import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export function useParticipantIndices() {
  const { contract, address } = useWeb3();
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchIndices = useCallback(async () => {
    if (!contract || !address) {
      setIndices([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = [];
      let i = 0;
      while (true) {
        try {
          const v = await contract.participantDialogueIndices(address, i);
          list.push(Number(v));
          i++;
        } catch {
          break;
        }
      }
      setIndices(list);
    } catch (err) {
      setError(err?.message || 'Error al cargar índices');
      setIndices([]);
    } finally {
      setLoading(false);
    }
  }, [contract, address]);

  useEffect(() => {
    fetchIndices();
  }, [fetchIndices]);

  return { indices, loading, error, refetch: fetchIndices };
}
