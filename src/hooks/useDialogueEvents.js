import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export function useDialogueEvents(onNewMessageForMe) {
  const { contract, address } = useWeb3();
  const [lastEvent, setLastEvent] = useState(null);

  const listener = useCallback(
    (sender, receiver, timestamp, globalIndex) => {
      setLastEvent({ sender, receiver, timestamp: Number(timestamp), globalIndex: Number(globalIndex) });
      if (address && receiver?.toLowerCase() === address.toLowerCase()) {
        onNewMessageForMe?.({ sender, receiver, timestamp: Number(timestamp), globalIndex: Number(globalIndex) });
      }
    },
    [address, onNewMessageForMe]
  );

  useEffect(() => {
    if (!contract) return;
    contract.on('DialogueAdded', listener);
    return () => {
      contract.off('DialogueAdded', listener);
    };
  }, [contract, listener]);

  return { lastEvent };
}
