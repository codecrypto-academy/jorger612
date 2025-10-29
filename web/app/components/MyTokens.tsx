'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ArrowLeft, Package, Calendar, User, Hash, Layers, Clock } from 'lucide-react';
import TransferModal from './TransferModal';
import AllTokensAdmin from './AllTokensAdmin';
import { contractService } from '../lib/contract';

interface Token {
  id: number;
  creator: string;
  name: string;
  totalSupply: string;
  balance: number;
  features: string;
  parentId: number;
  dateCreated: string;
  displayTotalSupply?: string; // Total Supply calculado para mostrar
}

interface TransferHistory {
  id: number;
  from: string;
  to: string;
  tokenId: number;
  amount: number;
  status: number;
  dateCreated: number;
  fromRole?: string;
  toRole?: string;
}

interface MyTokensProps {
  onBack: () => void;
}

export default function MyTokens({ onBack }: MyTokensProps) {
  const { address, blockchainService, selectedRole } = useWallet();
  
  // If the role is Admin, show AllTokensAdmin component
  if (selectedRole?.id === 'admin') {
    return <AllTokensAdmin onBack={onBack} />;
  }
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showTracing, setShowTracing] = useState(false);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (address) {
      loadUserTokens();
    }
  }, [address]);

  const loadUserTokens = async () => {
    if (!address || !blockchainService) return;

    setLoading(true);
    setError(null);

    try {
      // Get user's token IDs
      const tokenIds = await blockchainService.getUserTokens(address);

      if (tokenIds.length === 0) {
        setTokens([]);
        setLoading(false);
        return;
      }

      // Get detailed information for each token
      const tokenPromises = tokenIds.map(async (tokenId: number) => {
        try {
          const tokenData = await blockchainService.getToken(tokenId);
          
          // Get the user's balance for this token
          const balance = await contractService.getTokenBalance(tokenId, address);
          
          // Determinar el Total Supply a mostrar
          let displayTotalSupply = tokenData.totalSupply; // Por defecto usar el totalSupply original
          
          // Verificar si el token fue creado por la cuenta actual
          const isCreatedByCurrentAccount = tokenData.creator.toLowerCase() === address?.toLowerCase();
          
          if (isCreatedByCurrentAccount) {
            // Caso 1: Token creado por esta cuenta - mostrar el totalSupply de la creación
            displayTotalSupply = tokenData.totalSupply;
          } else {
            // Caso 2: Token recibido por transferencia - buscar el amount de la transferencia
            try {
              // Obtener todas las transferencias del usuario
              const userTransferIds = await contractService.getUserTransfers(address);
              let totalTransferredAmount = 0;
              
              for (const transferId of userTransferIds) {
                try {
                  const transferData = await contractService.getTransfer(Number(transferId));
                  
                  if (transferData && transferData.length >= 7) {
                    const [id, from, to, transferTokenId, dateCreated, amount, status] = transferData;
                    
                    // Verificar si esta transferencia es PARA el usuario actual para ESTE token y está aceptada
                    if (Number(transferTokenId) === tokenId && 
                        Number(status) === 1 &&
                        to.toLowerCase() === address?.toLowerCase()) {
                      totalTransferredAmount += Number(amount);
                    }
                  }
                } catch (error) {
                  // Saltar esta transferencia
                }
              }
              
              // Si encontramos transferencias, usar la cantidad total transferida
              if (totalTransferredAmount > 0) {
                displayTotalSupply = String(totalTransferredAmount);
              }
            } catch (error) {
              console.error(`Error buscando transferencias para token ${tokenId}:`, error);
            }
          }
          
          // Calculate adjusted balance (subtract transfers from Retailer to Consumer)
          let adjustedBalance = balance;
          if (selectedRole?.id === 'retailer') {
            try {
              const allAddresses = [
                '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Admin
                '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Producer
                '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Factory
                '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Retailer
                '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Consumer
              ];
              
              const consumerAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
              
              // Get transfers from current user to Consumer
              const userTransferIds = await contractService.getUserTransfers(address);
              
              for (const transferId of userTransferIds) {
                try {
                  const transferData = await contractService.getTransfer(Number(transferId));
                  
                  if (transferData && transferData.length >= 7) {
                    const [id, from, to, transferTokenId, dateCreated, amount, status] = transferData;
                    
                    // Only count accepted transfers (status === 1) from Retailer to Consumer for this token
                    if (Number(transferTokenId) === tokenId && 
                        Number(status) === 1 &&
                        from.toLowerCase() === address?.toLowerCase() &&
                        to.toLowerCase() === consumerAddress.toLowerCase()) {
                      adjustedBalance -= Number(amount);
                    }
                  }
                } catch (error) {
                  // Skip this transfer
                }
              }
            } catch (error) {
              console.error(`❌ Error calculating adjusted balance:`, error);
            }
          }
          
          return {
            ...tokenData,
            balance: Math.max(0, adjustedBalance),
            displayTotalSupply
          };
        } catch (error) {
          console.error(`❌ Error loading token ${tokenId}:`, error);
          return null;
        }
      });

      const tokenResults = await Promise.all(tokenPromises);
      const validTokens = tokenResults.filter(token => token !== null) as Token[];
      
      setTokens(validTokens);
    } catch (error: any) {
      console.error('❌ Error loading user tokens:', error);
      setError(error.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferClick = (token: Token) => {
    setSelectedToken(token);
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setSelectedToken(null);
    setIsTransferModalOpen(false);
  };

  const handleViewDetails = async (token: Token) => {
    setSelectedToken(token);
    setShowTracing(true);
    await loadTransferHistory(token.id);
  };

  const loadTransferHistory = async (tokenId: number) => {
    setLoadingHistory(true);
    try {
      // Get transfers for this specific token from ALL users in the system
      const tokenTransfers: TransferHistory[] = [];
      const processedTransfers = new Set<number>();
      
      // Get all predefined role addresses to search for transfers
      const allAddresses = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Admin
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Producer
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Factory
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Retailer
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Consumer
      ];
      
      // Add current user if not in the list
      if (address && !allAddresses.includes(address)) {
        allAddresses.push(address);
      }
      
      // Search transfers for all addresses
      for (const userAddress of allAddresses) {
        try {
          const userTransferIds = await contractService.getUserTransfers(userAddress);
          
          for (const transferId of userTransferIds) {
            // Avoid processing the same transfer twice
            if (processedTransfers.has(Number(transferId))) continue;
            processedTransfers.add(Number(transferId));
            
            try {
              const transferData = await contractService.getTransfer(Number(transferId));
              
              if (transferData && transferData.length >= 7) {
                const [id, from, to, transferTokenId, dateCreated, amount, status] = transferData;
                
                // Check if this transfer is for the selected token
                if (Number(transferTokenId) === tokenId) {
                  // Get roles for from and to addresses
                  let fromRole = 'Unknown';
                  let toRole = 'Unknown';
                  
                  try {
                    const fromInfo = await contractService.getUserInfo(from);
                    if (fromInfo && fromInfo.length >= 4) {
                      fromRole = fromInfo[2] as string;
                    }
                  } catch (e) {
                    // User not found, keep as Unknown
                  }
                  
                  try {
                    const toInfo = await contractService.getUserInfo(to);
                    if (toInfo && toInfo.length >= 4) {
                      toRole = toInfo[2] as string;
                    }
                  } catch (e) {
                    // User not found, keep as Unknown
                  }
                  
                  tokenTransfers.push({
                    id: Number(id),
                    from: from,
                    to: to,
                    tokenId: Number(transferTokenId),
                    amount: Number(amount),
                    status: Number(status),
                    dateCreated: Number(dateCreated),
                    fromRole: fromRole,
                    toRole: toRole
                  });
                }
              }
            } catch (error) {
              // Skip this transfer
            }
          }
        } catch (error) {
          // Skip this user's transfers
        }
      }
      
      // Sort by date
      tokenTransfers.sort((a, b) => a.dateCreated - b.dateCreated);
      
      setTransferHistory(tokenTransfers);
    } catch (error) {
      setTransferHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBackFromTracing = () => {
    setShowTracing(false);
    setSelectedToken(null);
    setTransferHistory([]);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const parseFeatures = (features: string) => {
    try {
      return JSON.parse(features);
    } catch {
      return null;
    }
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Accepted';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Show tracing view
  if (showTracing && selectedToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={handleBackFromTracing}
              className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to My Tokens
            </button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Tracing</h1>
            <p className="text-gray-800">Token: {selectedToken.name} (#{selectedToken.id})</p>
          </div>

          {/* Timeline */}
          {loadingHistory ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-800">Loading transfer history...</span>
            </div>
          ) : transferHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Transfer History</h3>
              <p className="text-gray-800">This token has no transfer records yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 overflow-x-auto">
              <div className="flex min-w-max pb-6" style={{ minWidth: `${Math.max(transferHistory.length * 300, 800)}px` }}>
                {transferHistory.map((transfer, index) => {
                  const datetime = formatDateTime(transfer.dateCreated);
                  return (
                    <div key={transfer.id} className="flex-shrink-0 w-72 mr-6">
                      <div className="relative">
                        {/* Timeline Line */}
                        {index < transferHistory.length - 1 && (
                          <div className="absolute top-8 left-16 w-full h-0.5 bg-blue-300"></div>
                        )}
                        
                        {/* Timeline Point */}
                        <div className="relative z-10">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Transfer Card */}
                      <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="mb-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(transfer.status)}`}>
                            {getStatusText(transfer.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-900">From:</span>
                            <p className="text-gray-800">{transfer.fromRole}</p>
                            <p className="text-gray-600 font-mono text-xs">{formatAddress(transfer.from)}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-900">To:</span>
                            <p className="text-gray-800">{transfer.toRole}</p>
                            <p className="text-gray-600 font-mono text-xs">{formatAddress(transfer.to)}</p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-900">Amount:</span>
                            <p className="text-gray-800">{transfer.amount.toLocaleString()}</p>
                          </div>
                          
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-1 text-gray-600 text-xs">
                              <Calendar className="w-3 h-3" />
                              <span>{datetime.date}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{datetime.time}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Tokens</h1>
          </div>

          {/* Loading State */}
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-800">Loading your tokens...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">My Tokens</h1>
          </div>

          {/* Error State */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">
              <Package className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Error Loading Tokens</h3>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <button
              onClick={loadUserTokens}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tokens</h1>
            <p className="text-gray-800 mt-1">
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        {/* Tokens Grid */}
        {tokens.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tokens Found</h3>
            <p className="text-gray-800 mb-6">
              You haven't created any tokens yet. Create your first token to get started.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => {
              const features = parseFeatures(token.features);
              
              return (
                <div
                  key={token.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  {/* Token Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{token.name}</h3>
                        <p className="text-sm text-gray-800">Token #{token.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-500">
                        {token.balance.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-800">Balance</div>
                    </div>
                  </div>

                  {/* Token Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <User className="w-4 h-4" />
                      <span>Creator: {formatAddress(token.creator)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Package className="w-4 h-4" />
                      <span>Total Supply: {token.displayTotalSupply || token.totalSupply}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(token.dateCreated)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <Hash className="w-4 h-4" />
                      <span>Parent ID: {token.parentId}</span>
                    </div>
                  </div>

                  {/* Features */}
                  {features && (
                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-gray-800" />
                        <span className="text-sm font-medium text-gray-900">Features</span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-xs text-gray-800 overflow-x-auto">
                          {JSON.stringify(features, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Token Actions */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleViewDetails(token)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Follow
                      </button>
                      <button 
                        onClick={() => handleTransferClick(token)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Transfer Modal */}
        {selectedToken && (
          <TransferModal
            isOpen={isTransferModalOpen}
            onClose={handleCloseTransferModal}
            token={selectedToken}
            userRole={selectedRole?.id || 'producer'}
          />
        )}
      </div>
    </div>
  );
}
