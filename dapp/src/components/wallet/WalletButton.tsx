'use client';

import { useWallet } from '@/context/WalletContext';
import { WalletIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CHAIN_ID } from '@/lib/contract';

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface WalletButtonProps {
  variant?: 'default' | 'landing';
}

export function WalletButton({ variant = 'default' }: WalletButtonProps) {
  const { account, chainId, isConnected, isOwner, connect, disconnect, error } = useWallet();
  const wrongChain = isConnected && chainId != null && chainId !== CHAIN_ID;

  const connectButtonClass =
    variant === 'landing'
      ? 'flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black hover:bg-slate-800 text-white text-sm font-medium transition-all'
      : 'flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#B8860B] hover:from-[#D4AF37] hover:to-[#C9A227] text-white text-sm font-medium transition-all duration-300 shadow-lg shadow-[#C9A227]/25 border border-[#C9A227]/30';

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={connect}
          data-testid="btn-connect-wallet"
          className={connectButtonClass}
        >
          <WalletIcon className="w-4 h-4" />
          {variant === 'landing' ? 'Connect Wallet' : 'Conectar Wallet'}
        </button>
        {error && (
          <p className="text-[11px] text-red-500 max-w-[220px] text-right font-medium">{error}</p>
        )}
      </div>
    );
  }

  if (wrongChain) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4C1D1D]/60 border border-red-500/40 text-white text-sm font-medium">
        <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
        <span>Red incorrecta (esperado: Anvil {CHAIN_ID})</span>
      </div>
    );
  }

  const isLight = variant === 'landing';

  return (
    <div className="flex items-center gap-3">
      {isOwner && (
        <span className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium ${isLight ? 'bg-violet-100 border border-violet-200 text-violet-700' : 'bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#D4AF37]'}`}>
          <CheckCircleIcon className="w-3.5 h-3.5" />
          Admin
        </span>
      )}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${isLight ? 'bg-slate-100 border border-slate-200' : 'bg-[#191D24] border border-[#232A34]'}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span data-testid="wallet-address" className={`text-sm font-mono font-medium ${isLight ? 'text-slate-800' : 'text-[#FAFBFC]'}`}>
          {shortAddr(account!)}
        </span>
      </div>
      <button
        onClick={disconnect}
        data-testid="btn-disconnect-wallet"
        className={`px-4 py-2.5 rounded-xl text-sm transition-all duration-300 ${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white' : 'text-[#9CA3AF] hover:text-white hover:bg-[#4C1D1D]/50 border border-[#232A34] hover:border-red-500/40 bg-[#191D24]'}`}
      >
        Desconectar
      </button>
    </div>
  );
}
