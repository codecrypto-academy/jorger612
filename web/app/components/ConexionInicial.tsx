'use client';

import { useWallet } from '../contexts/WalletContext';

interface ConexionInicialProps {
  onConnectionSuccess?: () => void;
}

export default function ConexionInicial({ onConnectionSuccess }: ConexionInicialProps) {
  const { connectWallet, isConnecting, error } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4 pt-20">
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-blue-100 rounded-full p-6">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome!</h1>
        <p className="text-gray-800 mb-4 leading-relaxed">
          Connect your MetaMask wallet to access the supply chain tracking
          system
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22.56 4.25c-.15-.33-.48-.56-.85-.56h-6.5c-.2 0-.39.08-.53.22L12.5 7.5 8.32 3.91c-.14-.14-.33-.22-.53-.22H1.29c-.37 0-.7.23-.85.56-.15.33-.05.71.25.95L6.5 10.5l-5.81 5.3c-.3.24-.4.62-.25.95.15.33.48.56.85.56h6.5c.2 0 .39-.08.53-.22L12.5 13.5l4.18 3.59c.14.14.33.22.53.22h6.5c.37 0 .7-.23.85-.56.15-.33.05-.71-.25-.95L18.5 10.5l5.81-5.3c.3-.24.4-.62.25-.95z"/>
          </svg>
          <span>{isConnecting ? 'Connecting...' : 'Connect with MetaMask'}</span>
        </button>

        <p className="mt-6 text-xs text-gray-900">
          Make sure you have MetaMask installed in your browser
        </p>
      </div>
    </div>
  );
}