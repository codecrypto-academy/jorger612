'use client';

import { useState, useEffect } from 'react';
import { X, Package, CheckCircle, ChevronDown } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../lib/contract';
import { BlockchainService } from '../lib/blockchain';
import Header from './Header';

interface Token {
  id: number;
  name: string;
  balance: number;
}

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateToken: (tokenData: {
    name: string;
    totalSupply: string;
    features: string;
    parentTokenId?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateTokenModal({
  isOpen,
  onClose,
  onCreateToken,
  isLoading = false
}: CreateTokenModalProps) {
  const { selectedRole, address } = useWallet();
  const blockchainService = new BlockchainService();
  const [formData, setFormData] = useState({
    name: '',
    totalSupply: '',
    features: '',
    parentTokenId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Load available tokens when modal opens and user is not Producer
  useEffect(() => {
    if (isOpen && selectedRole?.id !== 'producer' && address) {
      loadAvailableTokens();
    }
  }, [isOpen, selectedRole?.id, address]);

  const loadAvailableTokens = async () => {
    if (!address) return;

    setLoadingTokens(true);
    try {
      console.log('🔍 Loading available tokens for address:', address);
      const tokenIds = await blockchainService.getUserTokens(address);
      console.log('📋 Available token IDs:', tokenIds);

      if (tokenIds.length === 0) {
        setAvailableTokens([]);
        return;
      }

      // Get detailed information for each token and check if it was received via transfer
      const tokenPromises = tokenIds.map(async (tokenId) => {
        try {
          const tokenData = await blockchainService.getToken(Number(tokenId));
          const balance = await contractService.getTokenBalance(Number(tokenId), address);
          console.log(`📦 Token ${tokenId} data:`, tokenData, 'balance:', balance);
          
          // Check if this token was received via transfer (not created by this user)
          // If the creator is different from the current user, it means it was received via transfer
          const isReceivedToken = tokenData.creator.toLowerCase() !== address.toLowerCase();
          
          console.log(`🔍 Token ${tokenId} analysis:`, {
            creator: tokenData.creator,
            currentUser: address,
            isReceivedToken: isReceivedToken
          });
          
          // Only include tokens that were received via transfer and have balance > 0
          if (isReceivedToken && balance > 0) {
            return {
              id: Number(tokenId),
              name: tokenData.name,
              balance: balance
            };
          }
          
          return null;
        } catch (error) {
          console.error(`❌ Error loading token ${tokenId}:`, error);
          return null;
        }
      });

      const tokenResults = await Promise.all(tokenPromises);
      const validTokens = tokenResults.filter(token => token !== null) as Token[];
      
      setAvailableTokens(validTokens);
      console.log('✅ Loaded available received tokens:', validTokens);
    } catch (error: any) {
      console.error('❌ Error loading available tokens:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Token name is required';
    }

    if (!formData.totalSupply.trim()) {
      newErrors.totalSupply = 'Total supply is required';
    } else {
      const supply = parseInt(formData.totalSupply);
      if (isNaN(supply) || supply <= 0) {
        newErrors.totalSupply = 'Total supply must be a positive number';
      }
    }

    // Validate JSON format if features are provided
    if (formData.features.trim()) {
      try {
        JSON.parse(formData.features);
      } catch {
        newErrors.features = 'Features must be valid JSON format';
      }
    }

    // Validate parent token selection for non-Producer roles
    if (selectedRole?.id !== 'producer' && !formData.parentTokenId.trim()) {
      newErrors.parentTokenId = 'Parent token selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Determine parentTokenId based on role
      let parentTokenId: number;
      if (selectedRole?.id === 'producer') {
        parentTokenId = 0; // Producer ALWAYS creates raw materials with parentId = 0
        console.log('🔍 Producer creating token with parentId = 0');
      } else {
        // Factory and Retailer must use the selected token ID as parent
        if (!formData.parentTokenId) {
          throw new Error('Parent token selection is required for this role');
        }
        parentTokenId = Number(formData.parentTokenId);
        console.log('🔍 Non-Producer creating token with parentId =', parentTokenId);
      }

      const tokenData = {
        name: formData.name,
        totalSupply: formData.totalSupply,
        features: formData.features,
        parentTokenId: parentTokenId
      };
      
      console.log('🔍 Creating token with data:', {
        role: selectedRole?.id,
        parentTokenId: parentTokenId,
        tokenData: tokenData
      });
      
      
      await onCreateToken(tokenData);
      // Reset form on success
      setFormData({ name: '', totalSupply: '', features: '', parentTokenId: '' });
      setErrors({});
    } catch (error) {
      console.error('Error creating token:', error);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', totalSupply: '', features: '', parentTokenId: '' });
    setErrors({});
    setIsDropdownOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col z-50">
      {/* Header */}
      <Header 
        onNavigateToUserManagement={() => {}} 
        onNavigateToDashboard={() => {}} 
      />
      
      {/* Modal Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Create Token</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-800 mb-6">
            Create a new token for your role as {selectedRole?.name || 'User'}.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Token Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Token Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-900 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter token name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Total Supply */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Total Supply *
              </label>
              <input
                type="text"
                value={formData.totalSupply}
                onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder:text-gray-900 ${
                  errors.totalSupply ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter total supply (e.g., 1000)"
                disabled={isLoading}
              />
              {errors.totalSupply && (
                <p className="mt-1 text-sm text-red-600">{errors.totalSupply}</p>
              )}
            </div>

            {/* Features JSON */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Features (JSON)
              </label>
              <textarea
                value={formData.features}
                onChange={(e) => handleInputChange('features', e.target.value)}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none text-gray-900 placeholder:text-gray-900 ${
                  errors.features ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={`Enter features as JSON, e.g.:
{
  "origin": "Colombia",
  "quality": "Premium",
  "certification": "Organic",
  "harvest_date": "2024-03-15"
}`}
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-900">
                Optional: Add product characteristics in JSON format
              </p>
              {errors.features && (
                <p className="mt-1 text-sm text-red-600">{errors.features}</p>
              )}
            </div>

            {/* Parent Token Selection - Only show for non-Producer roles */}
            {selectedRole?.id !== 'producer' && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Parent Token * (Raw Material)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={loadingTokens || isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className={formData.parentTokenId ? 'text-gray-900' : 'text-gray-900'}>
                      {formData.parentTokenId ? 
                        (() => {
                          const selectedToken = availableTokens.find(token => token.id.toString() === formData.parentTokenId);
                          return selectedToken ? `#${selectedToken.id} - ${selectedToken.name} (Balance: ${selectedToken.balance})` : 'Select a parent token...';
                        })() : 
                        '✓ Select a parent token...'
                      }
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {loadingTokens ? (
                        <div className="px-4 py-3 text-center text-gray-900">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                          Loading tokens...
                        </div>
                      ) : availableTokens.length === 0 ? (
                        <div className="px-4 py-3 text-center text-gray-900">
                          No tokens available
                        </div>
                      ) : (
                        availableTokens.map((token) => (
                          <button
                            key={token.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, parentTokenId: token.id.toString() }));
                              setIsDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">#{token.id} - {token.name}</div>
                                <div className="text-sm text-gray-900">Balance: {token.balance.toLocaleString()}</div>
                              </div>
                              {formData.parentTokenId === token.id.toString() && (
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {errors.parentTokenId && (
                  <p className="mt-1 text-sm text-red-600">{errors.parentTokenId}</p>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900">Creating as {selectedRole?.name || 'User'}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {selectedRole?.id === 'producer' 
                      ? 'You can create raw material tokens and transfer them to factories.'
                      : selectedRole?.id === 'factory'
                      ? 'You can create product tokens from raw materials and transfer them to retailers.'
                      : selectedRole?.id === 'retailer'
                      ? 'You can create retail tokens from products and transfer them to consumers.'
                      : 'You can create tokens based on your role in the supply chain.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4" />
                    Create Token
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
