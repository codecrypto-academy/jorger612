'use client';

import { useWallet } from '../contexts/WalletContext';
import { NETWORKS } from '../lib/blockchain';

interface HeaderProps {
  onNavigateToUserManagement?: () => void;
  onNavigateToDashboard?: () => void;
}

export default function Header({ onNavigateToUserManagement, onNavigateToDashboard }: HeaderProps) {
  const { address, network, balance, selectedRole, isConnected, disconnect, switchNetwork, connectWallet, isConnecting, isAdminAccount } =
    useWallet();


  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string | null) => {
    if (!bal) return '0.0000';
    return parseFloat(bal).toFixed(4);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-2">
              <svg
                className="w-6 h-6 text-blue-600"
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
            <span className="text-xl font-semibold text-gray-900">
              Supply Chain Tracker
            </span>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {!isConnected ? (
              /* Connect Wallet Button */
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            ) : (
              <>
                {/* Admin-specific elements */}
                {isAdminAccount && (
                  <>
                    {/* Admin Shield Badge */}
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <svg
                        className="w-5 h-5 text-purple-600"
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
                      <span className="text-sm font-medium text-purple-700">
                        Admin
                      </span>
                    </div>

                    {/* Admin Panel Link */}
                    <button
                      onClick={onNavigateToUserManagement}
                      className="hidden md:flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-blue-600"
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
                      <span className="text-sm font-medium text-blue-700">
                        Admin Panel
                      </span>
                    </button>

                    {/* Dashboard Link */}
                    <button
                      onClick={onNavigateToDashboard}
                      className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-gray-800"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">
                        Dashboard
                      </span>
                    </button>
                  </>
                )}

                {/* Regular Role Badge for non-admin accounts */}
                {!isAdminAccount && selectedRole && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <span className="text-lg">{selectedRole.icon}</span>
                    <span className="text-sm font-medium text-purple-700">
                      {selectedRole.name}
                    </span>
                  </div>
                )}

                {/* Network Selector */}
                <div className="hidden sm:flex items-center gap-2">
                  <select
                    value={network?.chainId || ''}
                    onChange={(e) => {
                      const selectedChainId = parseInt(e.target.value);
                      
                      // Check if Sepolia is selected
                      if (selectedChainId === 11155111) {
                        alert('En Construccion para una Proxima Version');
                        // Revert to Anvil (localhost)
                        const anvilKey = Object.keys(NETWORKS).find(
                          (key) => NETWORKS[key as keyof typeof NETWORKS].chainId === 31337
                        );
                        if (anvilKey) {
                          switchNetwork(anvilKey as keyof typeof NETWORKS);
                        }
                        return;
                      }
                      
                      const networkKey = Object.keys(NETWORKS).find(
                        (key) =>
                          NETWORKS[key as keyof typeof NETWORKS].chainId === selectedChainId
                      );
                      if (networkKey) {
                        switchNetwork(networkKey as keyof typeof NETWORKS);
                      }
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(NETWORKS).map(([key, config]) => (
                      <option key={key} value={config.chainId} className="text-gray-900">
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Balance */}
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">
                    {formatBalance(balance)} ETH
                  </span>
                </div>

                {/* Wallet Info */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-white">
                    {address ? formatAddress(address) : 'No address'}
                  </span>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={disconnect}
                  className="p-2 text-gray-800 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Disconnect"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
