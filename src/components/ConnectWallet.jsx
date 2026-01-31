import { useWeb3 } from '../context/Web3Context';

export function ConnectWallet() {
  const { isConnected, displayAddress, isConnecting, error, connect, disconnect } = useWeb3();

  return (
    <div className="flex items-center gap-3">
      {error && (
        <p className="text-amber-400/90 text-sm font-medium" role="alert">
          {error}
        </p>
      )}
      {isConnected ? (
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-lg bg-elite-slate border border-elite-accent/50">
            <span className="text-premium-pearl/90 font-medium font-mono text-sm">
              {displayAddress}
            </span>
          </div>
          <button
            type="button"
            onClick={disconnect}
            className="px-4 py-2 rounded-lg border border-elite-silver/30 text-elite-silver hover:bg-elite-charcoal hover:text-premium-pearl transition-colors text-sm font-medium"
          >
            Desconectar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={isConnecting}
          className="px-5 py-2.5 rounded-lg bg-elite-gold/90 hover:bg-elite-gold text-elite-black font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-elite-gold/20"
        >
          {isConnecting ? 'Conectando…' : 'Conectar Wallet'}
        </button>
      )}
    </div>
  );
}
