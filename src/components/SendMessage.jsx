import { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useConversations } from '../hooks/useConversations';
import { formatAddress } from '../utils/format';

export function SendMessage({ selectedPeer, onSent }) {
  const { contract, address } = useWeb3();
  const { refetch } = useConversations();
  const [recipient, setRecipient] = useState(selectedPeer || '');

  useEffect(() => {
    if (selectedPeer) setRecipient(selectedPeer);
  }, [selectedPeer]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [gasEstimate, setGasEstimate] = useState(null);
  const [error, setError] = useState(null);

  const updateRecipient = (v) => {
    setRecipient(v);
    if (v) estimateGas(v, message);
    else setGasEstimate(null);
  };
  const updateMessage = (v) => {
    setMessage(v);
    if (recipient) estimateGas(recipient, v);
  };

  const estimateGas = async (to, msg) => {
    if (!contract || !to?.trim() || !msg?.trim()) {
      setGasEstimate(null);
      return;
    }
    setError(null);
    try {
      const gas = await contract.addDialogue.estimateGas(to.trim(), msg.trim());
      setGasEstimate(gas);
    } catch (e) {
      setGasEstimate(null);
    }
  };

  const send = async () => {
    const to = recipient?.trim();
    const msg = message?.trim();
    if (!contract || !to || !msg) {
      setError('Indica destinatario (0x...) y mensaje.');
      return;
    }
    if (to.toLowerCase() === address?.toLowerCase()) {
      setError('No puedes enviarte un mensaje a ti mismo.');
      return;
    }
    setSending(true);
    setError(null);
    setTxHash(null);
    try {
      const tx = await contract.addDialogue(to, msg);
      setTxHash(tx.hash);
      await tx.wait();
      setMessage('');
      setGasEstimate(null);
      refetch();
      onSent?.();
    } catch (err) {
      setError(err?.message || 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-elite-accent/20 bg-elite-slate/30 p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium text-elite-silver mb-1">
          Destinatario (0x...)
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => updateRecipient(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 rounded-lg bg-elite-charcoal border border-elite-accent/30 text-premium-pearl font-mono text-sm placeholder:text-elite-silver/50 focus:outline-none focus:ring-1 focus:ring-elite-gold/50"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-elite-silver mb-1">
          Mensaje
        </label>
        <textarea
          value={message}
          onChange={(e) => updateMessage(e.target.value)}
          placeholder="Escribe tu mensaje..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-elite-charcoal border border-elite-accent/30 text-premium-pearl text-sm placeholder:text-elite-silver/50 focus:outline-none focus:ring-1 focus:ring-elite-gold/50 resize-none"
        />
      </div>
      {gasEstimate != null && (
        <p className="text-xs text-elite-silver">
          Gas estimado: <span className="font-mono text-elite-gold/90">{gasEstimate.toString()}</span> units
          <span className="text-elite-silver/70 ml-1">(red local, coste ~0)</span>
        </p>
      )}
      {error && (
        <p className="text-sm text-amber-400/90">{error}</p>
      )}
      {txHash && !sending && (
        <p className="text-xs text-emerald-400/90 font-mono truncate">
          Tx: {formatAddress(txHash)}{txHash.slice(-6)}
        </p>
      )}
      <button
        type="button"
        onClick={send}
        disabled={sending || !recipient?.trim() || !message?.trim()}
        className="w-full py-2.5 rounded-lg bg-elite-gold/90 hover:bg-elite-gold text-elite-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <span className="w-4 h-4 border-2 border-elite-black/30 border-t-elite-black rounded-full animate-spin" />
            Confirmando en blockchain...
          </>
        ) : (
          'Enviar mensaje'
        )}
      </button>
    </div>
  );
}
