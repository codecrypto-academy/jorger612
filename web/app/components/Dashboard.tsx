'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import CreateTokenModal from './CreateTokenModal';
import MyTokens from './MyTokens';
import Profile from './Profile';
import Store from './Store';
import { contractService } from '../lib/contract';
import { Clock, Check, X, Package, Send, User, ShoppingCart, Receipt } from 'lucide-react';

interface Transfer {
  id: number;
  from: string;
  to: string;
  tokenId: number;
  amount: number;
  status: number;
  dateCreated: string;
}

interface Purchase {
  id: number;
  from: string;
  quantity: number;
  features: string;
}

export default function Dashboard() {
  const { selectedRole, address, blockchainService } = useWallet();
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [showMyTokens, setShowMyTokens] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showMyPurchases, setShowMyPurchases] = useState(false);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [processingTransfer, setProcessingTransfer] = useState<number | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Load transfers on component mount and when address changes
  useEffect(() => {
    if (address) {
      loadTransfers();
    }
  }, [address]);

  // Refresh transfers when returning to dashboard view
  useEffect(() => {
    // Refresh transfers when not showing any sub-view
    if (address && !showMyTokens && !showProfile && !showStore && !showMyPurchases) {
      loadTransfers();
    }
  }, [showMyTokens, showProfile, showStore, showMyPurchases, address]);

  const loadTransfers = async () => {
    if (!address) return;

    setLoadingTransfers(true);
    try {
      const transferIds = await contractService.getUserTransfers(address);

      if (transferIds.length === 0) {
        setTransfers([]);
        return;
      }

      // Get detailed information for each transfer
      const transferPromises = transferIds.map(async (transferId) => {
        try {
          const transferData = await contractService.getTransfer(Number(transferId));
          
          // Parse the transfer data (array structure: [id, from, to, tokenId, dateCreated, amount, status])
          if (transferData && transferData.length >= 7) {
            const [id, from, to, tokenId, dateCreated, amount, status] = transferData;
            
            // Convert all BigInt values to numbers
            const idNumber = Number(id);
            const tokenIdNumber = Number(tokenId);
            const statusNumber = Number(status);
            const dateCreatedNumber = Number(dateCreated);
            const amountNumber = Number(amount);
            
            return {
              id: idNumber,
              from: from,
              to: to,
              tokenId: tokenIdNumber,
              amount: amountNumber,
              status: statusNumber,
              dateCreated: new Date(dateCreatedNumber * 1000).toLocaleDateString('en-US')
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const transferResults = await Promise.all(transferPromises);
      const validTransfers = transferResults.filter(transfer => transfer !== null) as Transfer[];
      
      // Filter to show only pending transfers (status === 0)
      // TransferStatus enum: 0 = Pending, 1 = Accepted, 2 = Rejected
      const pendingTransfers = validTransfers.filter(transfer => transfer.status === 0);
      
      setTransfers(pendingTransfers);
    } catch (error: any) {
      // Error loading transfers
    } finally {
      setLoadingTransfers(false);
    }
  };

  const loadPurchases = async () => {
    if (!address) return;

    setLoadingPurchases(true);
    try {
      const purchaseIds = await contractService.getUserBuys(address);

      if (purchaseIds.length === 0) {
        setPurchases([]);
        return;
      }

      // Get detailed information for each purchase
      const purchasePromises = purchaseIds.map(async (purchaseId) => {
        try {
          const purchase = await contractService.getBuy(purchaseId);

          return {
            id: Number(purchase.id),
            from: purchase.from,
            quantity: Number(purchase.quantity),
            features: purchase.features
          };
        } catch (error) {
          return null;
        }
      });

      const purchaseResults = await Promise.all(purchasePromises);
      const validPurchases = purchaseResults.filter(purchase => purchase !== null) as Purchase[];
      
      setPurchases(validPurchases);
    } catch (error) {
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleAcceptTransfer = async (transferId: number) => {
    if (!address) return;

    setProcessingTransfer(transferId);
    try {
      const txHash = await contractService.acceptTransfer(transferId);
      
      // Reload transfers to update the list
      await loadTransfers();
      
      alert(`Transfer accepted successfully! Transaction hash: ${txHash}`);
    } catch (error: any) {
      alert(`Error accepting transfer: ${error.message}`);
    } finally {
      setProcessingTransfer(null);
    }
  };

  const handleRejectTransfer = async (transferId: number) => {
    if (!address) return;

    setProcessingTransfer(transferId);
    try {
      const txHash = await contractService.rejectTransfer(transferId);
      
      // Reload transfers to update the list
      await loadTransfers();
      
      alert(`Transfer rejected successfully! Transaction hash: ${txHash}`);
    } catch (error: any) {
      alert(`Error rejecting transfer: ${error.message}`);
    } finally {
      setProcessingTransfer(null);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleCreateToken = async (tokenData: {
    name: string;
    totalSupply: string;
    features: string;
    parentTokenId?: number;
  }) => {
    if (!address) {
      throw new Error('No wallet connected');
    }

    setIsCreatingToken(true);
    try {
      // Use the parentTokenId from the modal, or 0 if not provided
      const parentId = tokenData.parentTokenId ?? 0;
      
      const result = await blockchainService.createToken(
        tokenData.name,
        tokenData.totalSupply,
        tokenData.features,
        parentId
      );
      
      setIsCreateTokenModalOpen(false);
      
      // You could add a success notification here
      alert(`Token created successfully! Transaction hash: ${result.hash}`);
    } catch (error: any) {
      throw error; // Re-throw to let the modal handle the error display
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleMyTokensClick = () => {
    setShowMyTokens(true);
  };

  const handleBackFromMyTokens = () => {
    setShowMyTokens(false);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleBackFromProfile = () => {
    setShowProfile(false);
  };

  const handleStoreClick = () => {
    setShowStore(true);
  };

  const handleBackFromStore = () => {
    setShowStore(false);
  };

  const handleMyPurchasesClick = () => {
    setShowMyPurchases(true);
    loadPurchases();
  };

  const handleBackFromMyPurchases = () => {
    setShowMyPurchases(false);
  };

  // Show MyTokens component if requested
  if (showMyTokens) {
    return <MyTokens onBack={handleBackFromMyTokens} />;
  }

  // Show Profile component if requested
  if (showProfile) {
    return <Profile address={address || ''} onBack={handleBackFromProfile} />;
  }

  // Show Store component if requested (only for Consumer role)
  if (showStore) {
    return (
      <div>
        <Store onBack={handleBackFromStore} />
      </div>
    );
  }

  // Show My Purchases component if requested (only for Consumer role)
  if (showMyPurchases) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={handleBackFromMyPurchases}
              className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Purchases</h1>
            <p className="text-gray-800">Your purchase history</p>
          </div>

          {loadingPurchases ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-800">Loading purchases...</span>
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases found</h3>
              <p className="text-gray-800">You haven't made any purchases yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Purchase #{purchase.id}</h3>
                        <p className="text-sm text-gray-800">ID: {purchase.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Quantity:</span>
                      <span className="text-sm text-gray-900">{purchase.quantity}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">From:</span>
                      <span className="text-sm text-gray-900 font-mono">
                        {purchase.from.slice(0, 6)}...{purchase.from.slice(-4)}
                      </span>
                    </div>
                    
                    {purchase.features && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-900 block mb-2">Details:</span>
                        <div className="bg-gray-50 rounded-lg p-3 max-w-full overflow-hidden">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words overflow-wrap-anywhere">
                            {purchase.features}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Area - Cards Section */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${selectedRole?.id === 'consumer' ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6 mb-8`}>
          {/* My Tokens Card - Only for non-consumer roles */}
          {selectedRole?.id !== 'consumer' && (
            <div 
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={handleMyTokensClick}
            >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">My Tokens</h3>
                  <p className="text-sm text-gray-800">View and manage tokens.</p>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            </div>
          </div>
          )}

          {/* Create Token Card - Only for non-consumer roles */}
          {selectedRole?.id !== 'consumer' && (
          <div 
            className={`bg-white rounded-2xl shadow-lg p-6 transition-shadow ${
              selectedRole?.id === 'admin' 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:shadow-xl cursor-pointer'
            }`}
            onClick={() => selectedRole?.id !== 'admin' && setIsCreateTokenModalOpen(true)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Create Token</h3>
                  <p className="text-sm text-gray-800">Create new token</p>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-gray-800"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>
          </div>
          )}

          {/* Transfers Card - Only for non-consumer roles */}
          {selectedRole?.id !== 'consumer' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Transfers</h3>
                  <p className="text-sm text-gray-800">Pending transfers</p>
                </div>
              </div>
              <div className="relative">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Send className="w-4 h-4 text-gray-800" />
                </div>
                {transfers.length > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                    {transfers.length}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {loadingTransfers ? '...' : transfers.length}
              </div>
            </div>
          </div>
          )}

          {/* Store Card - Only for Consumer */}
          {selectedRole?.id === 'consumer' && (
            <div 
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={handleStoreClick}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Store</h3>
                    <p className="text-sm text-gray-800">Browse products</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-gray-800" />
                </div>
              </div>
            </div>
          )}

          {/* My Purchases Card - Only for Consumer */}
          {selectedRole?.id === 'consumer' && (
            <div 
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={handleMyPurchasesClick}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">My Purchases</h3>
                    <p className="text-sm text-gray-800">Purchase history</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-gray-800" />
                </div>
              </div>
            </div>
          )}

          {/* Profile Card - For all roles */}
          <div 
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={handleProfileClick}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                  <p className="text-sm text-gray-800">View profile</p>
                </div>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Transfers Section */}
        {transfers.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Pending Transfers</h2>
              </div>
            </div>

            <div className="space-y-6">
              {/* Transfers where current user is the sender (From) */}
              {transfers.filter(transfer => transfer.from.toLowerCase() === address?.toLowerCase()).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-600" />
                    Transfers waiting for recipient
                  </h3>
                  <div className="space-y-4">
                    {transfers
                      .filter(transfer => transfer.from.toLowerCase() === address?.toLowerCase())
                      .map((transfer) => (
                        <div
                          key={transfer.id}
                          className="bg-blue-50 rounded-lg p-6 border border-blue-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Token</p>
                                  <p className="text-lg font-semibold text-gray-900">Token #{transfer.tokenId}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">To</p>
                                  <p className="text-sm text-gray-900">{formatAddress(transfer.to)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Amount</p>
                                  <p className="text-lg font-semibold text-gray-900">{transfer.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Date</p>
                                  <p className="text-sm text-gray-900">{transfer.dateCreated}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-6">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                  <Clock className="w-6 h-6 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-800">Waiting for recipient</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Transfers where current user is the recipient (To) */}
              {transfers.filter(transfer => transfer.to.toLowerCase() === address?.toLowerCase()).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Transfers waiting for your approval
                  </h3>
                  <div className="space-y-4">
                    {transfers
                      .filter(transfer => transfer.to.toLowerCase() === address?.toLowerCase())
                      .map((transfer) => (
                        <div
                          key={transfer.id}
                          className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Token</p>
                                  <p className="text-lg font-semibold text-gray-900">Token #{transfer.tokenId}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">From</p>
                                  <p className="text-sm text-gray-900">{formatAddress(transfer.from)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Amount</p>
                                  <p className="text-lg font-semibold text-gray-900">{transfer.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Date</p>
                                  <p className="text-sm text-gray-900">{transfer.dateCreated}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 ml-6">
                              <button
                                onClick={() => handleAcceptTransfer(transfer.id)}
                                disabled={processingTransfer === transfer.id}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingTransfer === transfer.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectTransfer(transfer.id)}
                                disabled={processingTransfer === transfer.id}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processingTransfer === transfer.id ? (
                                  <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area - Bottom Section (Welcome and Next Steps Panel) */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Welcome Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Supply Chain Tracker
              </h2>
              <p className="text-lg text-gray-800 mb-6">
                Manage your tokens and transfers in the decentralized supply chain system
              </p>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-900">Your Role: </span>
                  <span className="text-gray-900">{selectedRole?.name || 'Admin'}</span>
                </div>
                <p className="text-gray-800">
                  Manage users, approve registrations, and oversee the entire supply chain system
                </p>
              </div>
            </div>

            {/* Next Steps Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Next Steps</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-900">View your current tokens</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-900">Create new tokens (if applicable)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-900">Manage pending transfers</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-900">Track supply chain history</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Create Token Modal */}
      <CreateTokenModal
        isOpen={isCreateTokenModalOpen}
        onClose={() => setIsCreateTokenModalOpen(false)}
        onCreateToken={handleCreateToken}
        isLoading={isCreatingToken}
      />
    </div>
  );
}