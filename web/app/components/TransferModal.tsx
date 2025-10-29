'use client';

import { useState, useEffect } from 'react';
import { X, Package, CheckCircle, User, AlertCircle, Send } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { 
  getAllowedDestinationRole, 
  getTransferRule, 
  getDestinationRoleName,
  getTransferDescription 
} from '../lib/transferRules';
import { contractService } from '../lib/contract';

interface Token {
  id: number;
  creator: string;
  name: string;
  totalSupply: string;
  features: string;
  parentId: number;
  dateCreated: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token;
  userRole: string;
}

interface UserInfo {
  address: string;
  role: string;
  status: number;
  name?: string;
}

export default function TransferModal({
  isOpen,
  onClose,
  token,
  userRole
}: TransferModalProps) {
  const { blockchainService, address } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isValidRecipient, setIsValidRecipient] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<UserInfo | null>(null);
  const [availableRecipients, setAvailableRecipients] = useState<UserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const destinationRole = getAllowedDestinationRole(userRole);
  const transferRule = getTransferRule(userRole);
  const destinationRoleName = getDestinationRoleName(userRole);
  const transferDescription = getTransferDescription(userRole);

  useEffect(() => {
    if (isOpen && destinationRole && address) {
      loadAvailableRecipients();
      loadTokenBalance();
    }
  }, [isOpen, destinationRole, token.id, address]);

  const loadTokenBalance = async () => {
    if (!address) return;
    
    try {
      const balance = await contractService.getTokenBalance(token.id, address);
      setTokenBalance(balance);
      console.log('✅ Token balance loaded:', balance);
    } catch (error) {
      console.error('❌ Error loading token balance:', error);
      setTokenBalance(0);
    }
  };

  const loadAvailableRecipients = async () => {
    if (!destinationRole) return;

    console.log('🔍 Current user role:', userRole);
    console.log('🔍 Destination role:', destinationRole);
    console.log('🔍 Current address:', address);

    try {
      // Get the destination role address from roles.ts
      const { ROLES } = await import('../lib/roles');
      const destinationRoleData = ROLES[destinationRole];
      
      if (!destinationRoleData) {
        console.log('❌ Destination role not found in ROLES');
        setAvailableRecipients([]);
        return;
      }

      console.log('🔍 Destination role data:', destinationRoleData);

      // Check if this address is approved using getUserInfo
      try {
        const userInfo = await contractService.getUserInfo(destinationRoleData.account);
        console.log('🔍 getUserInfo result:', userInfo);
        
        if (userInfo && userInfo.length >= 4) {
          const [id, userAddress, roleName, status] = userInfo;
          console.log('🔍 Parsed data:', { id, userAddress, roleName, status, statusType: typeof status });
          
          // Convert all BigInt values to numbers
          const idNumber = Number(id);
          const statusNumber = Number(status);
          console.log('🔍 Converted values:', { idNumber, statusNumber, roleName, destinationRole });
          
          if (roleName.toLowerCase() === destinationRole?.toLowerCase() && statusNumber === 1) {
            console.log('✅ Destination role is approved, adding to recipients');
            setAvailableRecipients([{
              address: destinationRoleData.account,
              role: destinationRole,
              status: statusNumber,
              name: destinationRoleData.name
            }]);
          } else {
            console.log('❌ Destination role not approved:', { roleName, statusNumber, destinationRole });
            setAvailableRecipients([]);
          }
        } else {
          console.log('❌ Invalid userInfo structure');
          setAvailableRecipients([]);
        }
      } catch (error) {
        console.log('❌ Error checking destination role:', error);
        setAvailableRecipients([]);
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
      setAvailableRecipients([]);
    }
  };

  const validateRecipient = async (address: string) => {
    if (!blockchainService || !address) {
      setIsValidRecipient(false);
      setRecipientInfo(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const userInfo = await contractService.getUserInfo(address);
      
      // getUserInfo returns [id, userAddress, role, status] as array
      if (userInfo && userInfo.length >= 4) {
        const [id, userAddress, roleName, status] = userInfo;
        
        // Convert all BigInt values to numbers
        const idNumber = Number(id);
        const statusNumber = Number(status);
        
        // Check if user exists, has correct role, and is approved
        if (roleName.toLowerCase() === destinationRole?.toLowerCase() && statusNumber === 1) {
          setIsValidRecipient(true);
          setRecipientInfo({
            address: userAddress,
            role: roleName,
            status: statusNumber
          });
        } else {
          setIsValidRecipient(false);
          setRecipientInfo(null);
        }
      } else {
        setIsValidRecipient(false);
        setRecipientInfo(null);
      }
    } catch (error) {
      console.error('Error validating recipient:', error);
      setIsValidRecipient(false);
      setRecipientInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRecipientChange = (value: string) => {
    setRecipientAddress(value);
    if (value) {
      validateRecipient(value);
    } else {
      setIsValidRecipient(false);
      setRecipientInfo(null);
    }
  };

  const handleAmountChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= tokenBalance) {
      setAmount(value);
    } else if (value === '') {
      setAmount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidRecipient || !amount || !blockchainService) {
      setError('Please fill in all fields correctly');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Initiating transfer:', {
        to: recipientAddress,
        tokenId: token.id,
        amount: parseInt(amount)
      });

      const result = await blockchainService.transfer(
        recipientAddress,
        token.id,
        parseInt(amount)
      );

      console.log('✅ Transfer successful:', result);
      alert(`Transfer request sent successfully! Transaction hash: ${result.hash}`);
      
      // Reset form and close modal
      setRecipientAddress('');
      setAmount('');
      setIsValidRecipient(false);
      setRecipientInfo(null);
      onClose();
    } catch (error: any) {
      console.error('❌ Transfer failed:', error);
      setError(error.message || 'Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setRecipientAddress('');
    setAmount('');
    setIsValidRecipient(false);
    setRecipientInfo(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Send Transfer Request</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-800" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Token Information Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{token.name}</h3>
                <p className="text-sm text-gray-800">Token #{token.id} • Balance: {tokenBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Transfer Rules Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900">Transfer Rules</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <User className="w-4 h-4" />
                    <span>Your Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
                  </div>
                  <div className="text-sm text-green-700">
                    You can transfer to: {destinationRoleName}s ({availableRecipients.length} available)
                  </div>
                  <div className="text-sm text-green-600">
                    {transferDescription}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Recipient ({destinationRoleName}) *
              </label>
              <select
                value={recipientAddress}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors font-bold text-gray-900 text-lg ${
                  recipientAddress && !isValidating
                    ? isValidRecipient 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">Select {destinationRoleName} address</option>
                {availableRecipients.map((recipient, index) => (
                  <option key={index} value={recipient.address}>
                    {recipient.name || destinationRoleName} - {recipient.address.slice(0, 6)}...{recipient.address.slice(-4)} (Approved)
                  </option>
                ))}
              </select>
              
              {/* Validation Message */}
              {recipientAddress && !isValidating && (
                <div className="mt-2 text-sm">
                  {isValidRecipient ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Valid recipient: {destinationRoleName} (Status: Approved)
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <X className="w-4 h-4" />
                      Invalid recipient: Must be an approved {destinationRoleName} (Status: {recipientInfo?.status === 0 ? 'Pending' : recipientInfo?.status === 2 ? 'Rejected' : 'Not Found'})
                    </div>
                  )}
                </div>
              )}
              
              {isValidating && (
                <div className="mt-2 text-sm text-gray-800">
                  Validating recipient...
                </div>
              )}
            </div>

            {/* Amount Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Amount *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors pr-20 font-bold text-gray-900 text-lg"
                  placeholder="Enter amount to transfer"
                  min="1"
                  max={tokenBalance}
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleAmountChange(String(Number(amount) + 1))}
                    className="text-gray-400 hover:text-gray-800"
                    disabled={isLoading}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAmountChange(String(Math.max(1, Number(amount) - 1)))}
                    className="text-gray-400 hover:text-gray-800"
                    disabled={isLoading}
                  >
                    ▼
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-900">
                Maximum: {tokenBalance.toLocaleString()} tokens
              </p>
            </div>

            {/* Important Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-900">Important</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This will create a transfer request. The recipient must accept the transfer before the tokens are actually moved. You can cancel the transfer if needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

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
                disabled={!isValidRecipient || !amount || isLoading}
                className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Transfer Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
