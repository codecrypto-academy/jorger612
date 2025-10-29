"use client";

import React, { useState, useEffect } from 'react';
import { User, Shield, Hash, CheckCircle, XCircle, Clock, Send, Download, AlertCircle } from 'lucide-react';
import { contractService } from '../lib/contract';
import { BlockchainService } from '../lib/blockchain';

interface UserProfile {
  account: string;
  role: string;
  id: number;
  status: number;
}

interface TransferStats {
  totalTokens: number;
  totalTransfersSent: number;
  totalTransfersReceived: number;
  pendingSent: number;
  pendingReceived: number;
  acceptedSent: number;
  acceptedReceived: number;
  rejectedSent: number;
  rejectedReceived: number;
}

interface ProfileProps {
  address: string;
  onBack: () => void;
}

export default function Profile({ address, onBack }: ProfileProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transferStats, setTransferStats] = useState<TransferStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create blockchain service instance
  const blockchainService = new BlockchainService();

  useEffect(() => {
    if (address) {
      loadProfileData();
    }
  }, [address]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const userInfo = await contractService.getUserInfo(address);
      console.log('🔍 User profile data:', userInfo);
      
      const profile: UserProfile = {
        account: address,
        role: userInfo.role,
        id: Number(userInfo.id),
        status: Number(userInfo.status)
      };
      setUserProfile(profile);

      // Load transfer statistics
      await loadTransferStats(address);

    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      setError(`Error loading profile: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTransferStats = async (userAddress: string) => {
    try {
      // Get user tokens and filter only those created by the user
      const tokenIds = await blockchainService.getUserTokens(userAddress);
      console.log(`🔍 All user tokens for ${userAddress}:`, tokenIds);
      
      const createdTokens = [];
      
      for (const tokenId of tokenIds) {
        try {
          const tokenData = await blockchainService.getToken(tokenId);
          console.log(`🔍 Token ${tokenId} creator: ${tokenData.creator}, user: ${userAddress}`);
          
          // Check if the token creator matches the current user
          if (tokenData.creator.toLowerCase() === userAddress.toLowerCase()) {
            createdTokens.push(tokenId);
            console.log(`✅ Token ${tokenId} created by user`);
          } else {
            console.log(`❌ Token ${tokenId} NOT created by user`);
          }
        } catch (error) {
          console.error(`Error checking token ${tokenId}:`, error);
        }
      }
      
      const totalTokens = createdTokens.length;
      console.log(`📊 Total tokens created by user: ${totalTokens}`);

      // Get user transfers
      const transferIds = await contractService.getUserTransfers(userAddress);
      const transfers = await Promise.all(
        transferIds.map(async (transferId: number) => {
          const transfer = await contractService.getTransfer(transferId);
          return {
            id: Number(transfer[0]),
            from: transfer[1],
            to: transfer[2],
            tokenId: Number(transfer[3]),
            dateCreated: Number(transfer[4]),
            amount: Number(transfer[5]),
            status: Number(transfer[6])
          };
        })
      );

      // Calculate statistics
      const stats: TransferStats = {
        totalTokens,
        totalTransfersSent: transfers.filter(t => t.from.toLowerCase() === userAddress.toLowerCase()).length,
        totalTransfersReceived: transfers.filter(t => t.to.toLowerCase() === userAddress.toLowerCase()).length,
        pendingSent: transfers.filter(t => t.from.toLowerCase() === userAddress.toLowerCase() && t.status === 0).length,
        pendingReceived: transfers.filter(t => t.to.toLowerCase() === userAddress.toLowerCase() && t.status === 0).length,
        acceptedSent: transfers.filter(t => t.from.toLowerCase() === userAddress.toLowerCase() && t.status === 1).length,
        acceptedReceived: transfers.filter(t => t.to.toLowerCase() === userAddress.toLowerCase() && t.status === 1).length,
        rejectedSent: transfers.filter(t => t.from.toLowerCase() === userAddress.toLowerCase() && t.status === 2).length,
        rejectedReceived: transfers.filter(t => t.to.toLowerCase() === userAddress.toLowerCase() && t.status === 2).length
      };

      setTransferStats(stats);
      console.log('📊 Transfer statistics:', stats);

    } catch (error: any) {
      console.error('❌ Error loading transfer stats:', error);
      setError(`Error loading transfer statistics: ${error.message}`);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Approved';
      case 2: return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'text-yellow-600 bg-yellow-100';
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-red-600 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-lg text-gray-800">Loading profile...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Profile</h2>
              <p className="text-gray-800 mb-6">{error}</p>
              <button
                onClick={onBack}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-800">User Profile</h1>
          <p className="text-gray-800">Complete overview of your account and activity</p>
        </div>

        {/* User Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">User Information</h2>
              <p className="text-gray-800">Account details and role information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Hash className="w-5 h-5 text-gray-900" />
                <div>
                  <p className="text-sm text-gray-900">Account</p>
                  <p className="font-mono text-lg">{formatAddress(userProfile?.account || '')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-900" />
                <div>
                  <p className="text-sm text-gray-900">Role</p>
                  <p className="text-lg font-semibold capitalize">{userProfile?.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-900" />
                <div>
                  <p className="text-sm text-gray-900">User ID</p>
                  <p className="text-lg font-semibold">{userProfile?.id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  {userProfile?.status === 1 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-900">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(userProfile?.status || 0)}`}>
                    {getStatusText(userProfile?.status || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Activity Statistics</h2>
              <p className="text-gray-800">Complete overview of your blockchain activity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tokens */}
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Hash className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Tokens Created</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">{transferStats?.totalTokens || 0}</p>
              <p className="text-sm text-gray-800">Total tokens created</p>
            </div>

            {/* Transfers Sent */}
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Transfers Sent</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">{transferStats?.totalTransfersSent || 0}</p>
              <p className="text-sm text-gray-800">Total transfers initiated</p>
            </div>

            {/* Transfers Received */}
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Transfers Received</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">{transferStats?.totalTransfersReceived || 0}</p>
              <p className="text-sm text-gray-800">Total transfers received</p>
            </div>

            {/* Pending Sent */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Pending Sent</h3>
              </div>
              <p className="text-3xl font-bold text-yellow-600">{transferStats?.pendingSent || 0}</p>
              <p className="text-sm text-gray-800">Awaiting recipient response</p>
            </div>

            {/* Pending Received */}
            <div className="bg-orange-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Pending Received</h3>
              </div>
              <p className="text-3xl font-bold text-orange-600">{transferStats?.pendingReceived || 0}</p>
              <p className="text-sm text-gray-800">Awaiting your response</p>
            </div>

            {/* Accepted Sent */}
            <div className="bg-emerald-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Accepted Sent</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-600">{transferStats?.acceptedSent || 0}</p>
              <p className="text-sm text-gray-800">Successfully completed</p>
            </div>

            {/* Accepted Received */}
            <div className="bg-teal-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Accepted Received</h3>
              </div>
              <p className="text-3xl font-bold text-teal-600">{transferStats?.acceptedReceived || 0}</p>
              <p className="text-sm text-gray-800">Successfully accepted</p>
            </div>

            {/* Rejected Sent */}
            <div className="bg-red-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Rejected Sent</h3>
              </div>
              <p className="text-3xl font-bold text-red-600">{transferStats?.rejectedSent || 0}</p>
              <p className="text-sm text-gray-800">Rejected by recipients</p>
            </div>

            {/* Rejected Received */}
            <div className="bg-rose-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Rejected Received</h3>
              </div>
              <p className="text-3xl font-bold text-rose-600">{transferStats?.rejectedReceived || 0}</p>
              <p className="text-sm text-gray-800">Rejected by you</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
