'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useWallet as useWalletHook } from '../hooks/useWallet';

interface WalletContextType {
  address: string | null;
  chainId: number | null;
  network: any;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  hasSelectedRole: boolean;
  selectedRole: any;
  error: string | null;
  registrationStatus: 'none' | 'pending' | 'success' | 'error';
  registrationError: string | null;
  isAdminAccount: boolean;
  isProducerAccount: boolean;
  isConsumerAccount: boolean;
  showWelcomeBack: boolean;
  showProducerWelcome: boolean;
  userInfo: any | null;
  isCheckingUserInfo: boolean;
  connectWallet: () => Promise<void>;
  switchNetwork: (networkKey: string) => Promise<void>;
  selectRole: (role: any) => Promise<void>;
  disconnect: () => void;
  continueToDashboard: () => void;
  goToDashboard: () => void;
  goToProducerDashboard: () => void;
  blockchainService: any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useWalletHook();

  return (
    <WalletContext.Provider value={wallet}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
