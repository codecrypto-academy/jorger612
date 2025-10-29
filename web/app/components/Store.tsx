"use client";

import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Plus, Minus, X, Check, ArrowLeft, Calendar, Clock } from 'lucide-react';
import { contractService } from '../lib/contract';
import { BlockchainService } from '../lib/blockchain';

interface StoreToken {
  id: number;
  name: string;
  creator: string;
  totalSupply: string;
  features: string;
  parentId: number;
  dateCreated: number;
  balance: number;
}

interface CartItem {
  tokenId: number;
  name: string;
  quantity: number;
  available: number;
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

interface StoreProps {
  onBack: () => void;
}

export default function Store({ onBack }: StoreProps) {
  const [tokens, setTokens] = useState<StoreToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [quantities, setQuantities] = useState<{ [tokenId: number]: number }>({});
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [showTracing, setShowTracing] = useState(false);
  const [selectedToken, setSelectedToken] = useState<StoreToken | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const blockchainService = new BlockchainService();

  useEffect(() => {
    loadStoreTokens();
  }, []);

  const loadStoreTokens = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all retailer addresses
      const retailerAddresses = [
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906' // Retailer account
      ];

      const allTokens: StoreToken[] = [];

      for (const retailerAddress of retailerAddresses) {
        try {
          // Check if retailer is approved
          const userInfo = await contractService.getUserInfo(retailerAddress);
          if (Number(userInfo.status) !== 1) {
            continue;
          }

          // Get retailer's tokens
          const tokenIds = await blockchainService.getUserTokens(retailerAddress);

          for (const tokenId of tokenIds) {
            try {
              const tokenData = await blockchainService.getToken(tokenId);
              const balance = await contractService.getTokenBalance(tokenId, retailerAddress);
              
              // Calculate adjusted balance (subtract transfers from Retailer to Consumer)
              let adjustedBalance = balance;
              
              try {
                const consumerAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
                
                // Get transfers from Retailer to Consumer
                const userTransferIds = await contractService.getUserTransfers(retailerAddress);
                
                for (const transferId of userTransferIds) {
                  try {
                    const transferData = await contractService.getTransfer(Number(transferId));
                    
                    if (transferData && transferData.length >= 7) {
                      const [id, from, to, transferTokenId, dateCreated, amount, status] = transferData;
                      
                      // Only count accepted transfers (status === 1) from Retailer to Consumer for this token
                      if (Number(transferTokenId) === tokenId && 
                          Number(status) === 1 &&
                          from.toLowerCase() === retailerAddress.toLowerCase() &&
                          to.toLowerCase() === consumerAddress.toLowerCase()) {
                        adjustedBalance -= Number(amount);
                      }
                    }
                  } catch (error) {
                    // Skip this transfer
                  }
                }
              } catch (error) {
                console.error(`Error calculating adjusted balance:`, error);
              }
              
              // Only include tokens with adjusted balance > 0
              adjustedBalance = Math.max(0, adjustedBalance);
              if (adjustedBalance > 0) {
                allTokens.push({
                  id: Number(tokenData.id),
                  name: tokenData.name,
                  creator: tokenData.creator,
                  totalSupply: tokenData.totalSupply,
                  features: tokenData.features,
                  parentId: Number(tokenData.parentId),
                  dateCreated: Number(tokenData.dateCreated),
                  balance: adjustedBalance
                });
              }
            } catch (error) {
              console.error(`Error loading token ${tokenId}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error loading retailer ${retailerAddress}:`, error);
        }
      }

      setTokens(allTokens);

    } catch (error: any) {
      console.error('❌ Error loading store tokens:', error);
      setError(`Error loading store: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (tokenId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setQuantities(prev => ({
      ...prev,
      [tokenId]: Math.max(0, quantity)
    }));
  };

  const handleAddToCart = (token: StoreToken) => {
    const quantity = quantities[token.id] || 0;
    
    if (quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (quantity > token.balance) {
      alert(`Quantity cannot exceed available amount (${token.balance})`);
      return;
    }

    const existingItem = cart.find(item => item.tokenId === token.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > token.balance) {
        alert(`Total quantity cannot exceed available amount (${token.balance})`);
        return;
      }
      
      setCart(prev => prev.map(item => 
        item.tokenId === token.id 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        tokenId: token.id,
        name: token.name,
        quantity: quantity,
        available: token.balance
      }]);
    }

    // Reset quantity input
    setQuantities(prev => ({
      ...prev,
      [token.id]: 0
    }));
  };

  const removeFromCart = (tokenId: number) => {
    setCart(prev => prev.filter(item => item.tokenId !== tokenId));
  };

  const updateCartQuantity = (tokenId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(tokenId);
      return;
    }

    const cartItem = cart.find(item => item.tokenId === tokenId);
    if (cartItem && quantity > cartItem.available) {
      alert(`Quantity cannot exceed available amount (${cartItem.available})`);
      return;
    }

    setCart(prev => prev.map(item => 
      item.tokenId === tokenId 
        ? { ...item, quantity: quantity }
        : item
    ));
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };


  const handlePurchase = async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    setIsProcessingPurchase(true);
    
    try {
      // Calculate total quantity
      const totalQuantity = getTotalItems();
      
      // Create JSON with product details
      const purchaseDetails = {
        products: cart.map(item => ({
          tokenId: item.tokenId,
          name: item.name,
          quantity: item.quantity
        })),
        totalQuantity: totalQuantity,
        timestamp: new Date().toISOString()
      };
      
      const featuresJson = JSON.stringify(purchaseDetails);
      
      // Call the smart contract storeBuy function
      const txHash = await contractService.storeBuy(totalQuantity, featuresJson);
      
      // Create transfers for each token in the cart (Retailer to Consumer)
      const retailerAddress = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';
      const consumerAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
      
      const transferPromises = cart.map(async (item) => {
        try {
          const transferHash = await contractService.transferCompra(
            retailerAddress,
            consumerAddress,
            item.tokenId,
            item.quantity
          );
          return transferHash;
        } catch (error) {
          console.error(`Error creating transfer for token ${item.tokenId}:`, error);
          throw error;
        }
      });
      
      const transferHashes = await Promise.all(transferPromises);
      
      // Clear cart and show success message
      setCart([]);
      setIsCartModalOpen(false);
      
      alert(`Compra realizada exitosamente!\n\nHash de compra: ${txHash}\nTransfers creados: ${transferHashes.length}`);
      
      // Reload store tokens to update availability
      await loadStoreTokens();
      
    } catch (error: any) {
      console.error('❌ Error processing purchase:', error);
      alert(`Error al procesar la compra: ${error.message}`);
    } finally {
      setIsProcessingPurchase(false);
    }
  };

  const handleFollowClick = async (token: StoreToken) => {
    setSelectedToken(token);
    setShowTracing(true);
    await loadTransferHistory(token.id);
  };

  const loadTransferHistory = async (tokenId: number) => {
    setLoadingHistory(true);
    try {
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
      
      // Search transfers for all addresses
      for (const userAddress of allAddresses) {
        try {
          const userTransferIds = await contractService.getUserTransfers(userAddress);
          
          for (const transferId of userTransferIds) {
            if (processedTransfers.has(Number(transferId))) continue;
            processedTransfers.add(Number(transferId));
            
            try {
              const transferData = await contractService.getTransfer(Number(transferId));
              
              if (transferData && transferData.length >= 7) {
                const [id, from, to, transferTokenId, dateCreated, amount, status] = transferData;
                
                if (Number(transferTokenId) === tokenId) {
                  let fromRole = 'Unknown';
                  let toRole = 'Unknown';
                  
                  try {
                    const fromInfo = await contractService.getUserInfo(from);
                    if (fromInfo && fromInfo.length >= 4) {
                      fromRole = fromInfo[2] as string;
                    }
                  } catch (e) {}
                  
                  try {
                    const toInfo = await contractService.getUserInfo(to);
                    if (toInfo && toInfo.length >= 4) {
                      toRole = toInfo[2] as string;
                    }
                  } catch (e) {}
                  
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
            } catch (error) {}
          }
        } catch (error) {}
      }
      
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatFeatures = (features: string) => {
    try {
      const parsed = JSON.parse(features);
      return typeof parsed === 'string' ? parsed : features;
    } catch {
      return features;
    }
  };

  // Show tracing view
  if (showTracing && selectedToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={handleBackFromTracing}
              className="flex items-center gap-2 text-gray-800 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Store
            </button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Tracing</h1>
            <p className="text-gray-800">Token: {selectedToken.name} (#{selectedToken.id})</p>
          </div>

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
                        {index < transferHistory.length - 1 && (
                          <div className="absolute top-8 left-16 w-full h-0.5 bg-blue-300"></div>
                        )}
                        <div className="relative z-10">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      </div>

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
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-lg text-gray-800 font-medium">Loading store...</span>
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
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Store</h2>
              <p className="text-gray-900 mb-6 font-medium">{error}</p>
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🏪 Store</h1>
              <p className="text-gray-900 font-medium">Available products from approved retailers</p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setIsCartModalOpen(true)}
              className="relative bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tokens.map((token) => (
            <div key={token.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{token.name}</h3>
                    <p className="text-sm text-gray-900 font-medium">Token #{token.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{token.balance}</div>
                  <div className="text-sm text-gray-800 font-medium">Disponible</div>
                </div>
              </div>

              {/* Features */}
              <div className="border-t pt-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-900" />
                  <span className="text-sm font-medium text-gray-800">Features</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-800 font-medium">{formatFeatures(token.features)}</p>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="border-t pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">Cantidad</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={token.balance}
                  value={quantities[token.id] || 0}
                  onChange={(e) => handleQuantityChange(token.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-gray-900 text-lg"
                  placeholder="0"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleFollowClick(token)}
                  className="flex-1 bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  Follow
                </button>
                <button
                  onClick={() => handleAddToCart(token)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>

        {tokens.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-900 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Available</h3>
            <p className="text-gray-900 font-medium">No approved retailers have products in stock.</p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {isCartModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Shopping Cart
              </h2>
              <button
                onClick={() => setIsCartModalOpen(false)}
                className="text-gray-800 hover:text-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-16 h-16 text-gray-900 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.tokenId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-900 font-medium">Token #{item.tokenId}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(item.tokenId, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                          >
                            <Minus className="w-4 h-4 text-gray-900" />
                          </button>
                          <span className="w-12 text-center font-medium text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.tokenId, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                            disabled={item.quantity >= item.available}
                          >
                            <Plus className="w-4 h-4 text-gray-900" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(item.tokenId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {cart.length > 0 && (
              <div className="border-t p-6">
                <div className="flex justify-center items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total Items: {getTotalItems()}</span>
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={isProcessingPurchase}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Check className="w-5 h-5" />
                  {isProcessingPurchase ? 'Procesando...' : 'Comprar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
