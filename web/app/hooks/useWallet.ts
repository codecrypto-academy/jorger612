'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlockchainService, NETWORKS, NetworkConfig } from '../lib/blockchain';
import { Role, getRoleById, getRoleByAccount } from '../lib/roles';
import { contractService } from '../lib/contract';

interface WalletState {
  address: string | null;
  chainId: number | null;
  network: NetworkConfig | null;
  balance: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  hasSelectedRole: boolean;
  selectedRole: Role | null;
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
}

const blockchainService = new BlockchainService();

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    network: null,
    balance: null,
    isConnecting: false,
    isConnected: false,
    hasSelectedRole: false,
    selectedRole: null,
    error: null,
    registrationStatus: 'none',
    registrationError: null,
    isAdminAccount: false,
    isProducerAccount: false,
    isConsumerAccount: false,
    showWelcomeBack: false,
    showProducerWelcome: false,
    userInfo: null,
    isCheckingUserInfo: false,
  });

  // Cache para evitar llamadas repetidas
  const [userInfoCache, setUserInfoCache] = useState<Map<string, any>>(new Map());
  const [pendingCalls, setPendingCalls] = useState<Set<string>>(new Set());

  const updateBalance = useCallback(async (address: string) => {
    try {
      const balance = await blockchainService.getBalance(address);
      setState((prev) => ({ ...prev, balance }));
    } catch (error) {
      console.error('Error updating balance:', error);
      setState((prev) => ({ ...prev, balance: '0' }));
    }
  }, []);

  const checkAdminAccount = useCallback((address: string) => {
    const adminAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
    return address && address.toLowerCase() === adminAddress.toLowerCase();
  }, []);

  const checkConsumerAccount = useCallback((address: string) => {
    const consumerAddress = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
    return address && address.toLowerCase() === consumerAddress.toLowerCase();
  }, []);

  const checkProducerAccount = useCallback((address: string) => {
    const producerAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    return address && address.toLowerCase() === producerAddress.toLowerCase();
  }, []);

  const checkUserInfo = useCallback(async (address: string) => {
    // Verificar cache primero
    if (userInfoCache.has(address)) {
      return userInfoCache.get(address);
    }
    
    // Verificar si ya hay una llamada pendiente para esta dirección
    if (pendingCalls.has(address)) {
      // Esperar a que termine la llamada pendiente
      return new Promise((resolve) => {
        const checkPending = () => {
          if (!pendingCalls.has(address)) {
            resolve(userInfoCache.get(address) || null);
          } else {
            setTimeout(checkPending, 100);
          }
        };
        checkPending();
      });
    }
    
    // Marcar como pendiente
    setPendingCalls(prev => new Set(prev).add(address));
    setState((prev) => ({ ...prev, isCheckingUserInfo: true }));
    
    try {
      const userInfo = await contractService.getUserInfo(address);
      
      // Guardar en cache
      setUserInfoCache(prev => new Map(prev).set(address, userInfo));
      
      setState((prev) => ({
        ...prev,
        userInfo,
        isCheckingUserInfo: false,
        showWelcomeBack: userInfo !== null,
      }));
      
      return userInfo;
    } catch (error) {
      console.error('❌ Error checking user info:', error);
      setState((prev) => ({
        ...prev,
        userInfo: null,
        isCheckingUserInfo: false,
        showWelcomeBack: false,
      }));
      return null;
    } finally {
      // Remover de pendientes
      setPendingCalls(prev => {
        const newSet = new Set(prev);
        newSet.delete(address);
        return newSet;
      });
    }
  }, [userInfoCache, pendingCalls]);

  // Función para limpiar cache cuando sea necesario
  const clearUserInfoCache = useCallback((address?: string) => {
    if (address) {
      setUserInfoCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(address);
        return newCache;
      });
    } else {
      setUserInfoCache(new Map());
    }
  }, []);

  const updateNetwork = useCallback(async () => {
    try {
      const network = await blockchainService.getCurrentNetwork();
      const chainId = network?.chainId || null;
      setState((prev) => ({ ...prev, network, chainId }));
    } catch (error) {
      // Handle network error silently
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask no está instalado');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No se pudieron obtener las cuentas');
      }

      const address = accounts[0];
      const isAdmin = checkAdminAccount(address);
      const isProducer = checkProducerAccount(address);
      const isConsumer = checkConsumerAccount(address);

      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });
      const chainIdNumber = parseInt(chainId, 16);

      // Refresh the contract signer to ensure it's using the correct account
      await contractService.refreshSigner();

      // Verificar información del usuario UNA SOLA VEZ
      let userInfo = await checkUserInfo(address);
      let isRegistered = Boolean(userInfo);
      let userRole = userInfo?.role || null;

      // Si es Admin y no está registrado, registrarlo y aprobarlo automáticamente
      if (isAdmin && !isRegistered) {
        try {
          // Registrar Admin
          await contractService.requestUserRole('Admin', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
          
          // Aprobar Admin (status = 1)
          await contractService.changeStatusUser('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 1);
          
          // Limpiar cache y obtener información actualizada
          setUserInfoCache(prev => {
            const newCache = new Map(prev);
            newCache.delete(address);
            return newCache;
          });
          
          // Esperar un poco para que se procese la transacción
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Obtener información actualizada
          userInfo = await checkUserInfo(address);
          isRegistered = Boolean(userInfo);
          userRole = userInfo?.role || null;
        } catch (error) {
          console.error('Error registering/approving Admin:', error);
        }
      }

      setState((prev) => ({
        ...prev,
        address,
        chainId: chainIdNumber,
        network: { chainId: chainIdNumber, name: 'Anvil (Localhost)' },
        isConnected: true,
        isConnecting: false,
        isAdminAccount: Boolean(isAdmin),
        isProducerAccount: Boolean(isProducer),
        isConsumerAccount: Boolean(isConsumer),
        showWelcomeBack: Boolean(userInfo),
        showProducerWelcome: false,
        hasSelectedRole: Boolean(isAdmin || isProducer || isConsumer || isRegistered),
        selectedRole: isAdmin 
          ? { id: 'admin', name: 'Admin', icon: '👑', description: 'System Administrator', account: address }
          : isProducer 
          ? { id: 'producer', name: 'Producer', icon: '📦', description: 'Product Producer', account: address }
          : isConsumer
          ? { id: 'consumer', name: 'Consumer', icon: '🛒', description: 'End Consumer', account: address }
          : isRegistered
          ? { id: userRole?.toLowerCase(), name: userRole, icon: '👤', description: `${userRole} Account`, account: address }
          : null,
        userInfo,
      }));

    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message,
      }));
    }
  }, [checkUserInfo, checkAdminAccount, checkProducerAccount, checkConsumerAccount]);

  const switchNetwork = useCallback(
    async (networkKey: keyof typeof NETWORKS) => {
      try {
        setState((prev) => ({ ...prev, error: null }));
        await blockchainService.switchNetwork(networkKey);

        await new Promise(resolve => setTimeout(resolve, 500));

        await updateNetwork();

        if (state.address) {
          await updateBalance(state.address);
        }
      } catch (error: any) {
        setState((prev) => ({ ...prev, error: error.message }));
      }
    },
    [state.address, updateBalance, updateNetwork]
  );

  const selectRole = useCallback(async (role: Role) => {
    setState((prev) => ({ 
      ...prev, 
      isConnecting: true, 
      error: null, 
      registrationStatus: 'pending',
      registrationError: null 
    }));

    try {
      // Usar la dirección mapeada del rol seleccionado
      const roleAddress = role.account;
      
      // Verificar si la cuenta es administrador
      const isAdminAccount = await contractService.isAdmin(roleAddress);
      
      if (isAdminAccount) {
        throw new Error('Los administradores no pueden registrarse como usuarios. Los administradores solo pueden gestionar otros usuarios.');
      }
      
      // Llamar a la función del contrato para solicitar el rol
      const txHash = await contractService.requestUserRole(role.name, roleAddress);
      
      // Si el usuario ya estaba registrado, verificar su información
      if (txHash === 'already-registered') {
        const userInfo = await checkUserInfo(state.address || '');
        setState((prev) => ({
          ...prev,
          hasSelectedRole: true,
          selectedRole: role,
          isConnecting: false,
          registrationStatus: 'success',
          registrationError: null,
          userInfo,
          showWelcomeBack: true,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          hasSelectedRole: true,
          selectedRole: role,
          isConnecting: false,
          registrationStatus: 'success',
          registrationError: null,
        }));
      }

    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message || 'Failed to select role',
        registrationStatus: 'error',
        registrationError: error.message || 'Failed to select role',
      }));
    }
  }, []);

  const continueToDashboard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      registrationStatus: 'none',
      registrationError: null,
    }));
  }, []);

  const goToDashboard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showWelcomeBack: false,
    }));
  }, []);

  const goToProducerDashboard = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showProducerWelcome: false,
    }));
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      network: null,
      balance: null,
      isConnecting: false,
      isConnected: false,
      hasSelectedRole: false,
      selectedRole: null,
      error: null,
      registrationStatus: 'none',
      registrationError: null,
      isAdminAccount: false,
      isProducerAccount: false,
      isConsumerAccount: false,
      showWelcomeBack: false,
      showProducerWelcome: false,
      userInfo: null,
      isCheckingUserInfo: false,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        // Get the currently selected account from MetaMask
        const selectedAccounts = await window.ethereum.request({ method: 'eth_accounts' });
        const newAddress = selectedAccounts[0];
        
        // Refresh the contract signer to use the new account
        await contractService.refreshSigner();
        
        const isAdmin = checkAdminAccount(newAddress);
        const isProducer = checkProducerAccount(newAddress);
        const isConsumer = checkConsumerAccount(newAddress);
        
        // Verificar información del usuario en el smart contract
        const userInfo = await checkUserInfo(newAddress);
        
        // Si el usuario está registrado, determinar el rol desde el smart contract
        const isRegistered = Boolean(userInfo);
        const userRole = userInfo?.role || null;
        
        setState((prev) => ({
          ...prev,
          address: newAddress,
          isAdminAccount: Boolean(isAdmin),
          isProducerAccount: Boolean(isProducer),
          isConsumerAccount: Boolean(isConsumer),
          showWelcomeBack: Boolean(userInfo), // Mostrar para cualquier usuario registrado
          showProducerWelcome: false, // Ya no se usa, todos van a WelcomeBack
          hasSelectedRole: Boolean(isAdmin || isProducer || isConsumer || isRegistered), // Cualquier cuenta registrada tiene rol
          selectedRole: isAdmin 
            ? { id: 'admin', name: 'Admin', icon: '👑', description: 'System Administrator', account: newAddress }
            : isProducer 
            ? { id: 'producer', name: 'Producer', icon: '📦', description: 'Product Producer', account: newAddress }
            : isConsumer
            ? { id: 'consumer', name: 'Consumer', icon: '🛒', description: 'End Consumer', account: newAddress }
            : isRegistered
            ? { id: userRole?.toLowerCase(), name: userRole, icon: '👤', description: `${userRole} Account`, account: newAddress }
            : null,
          userInfo,
        }));
        updateBalance(newAddress);
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);

      await new Promise(resolve => setTimeout(resolve, 300));

      setState((prev) => ({ ...prev, chainId }));
      await updateNetwork();

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        await updateBalance(accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, updateBalance, updateNetwork]);

  return {
    ...state,
    connectWallet,
    switchNetwork,
    selectRole,
    disconnect,
    continueToDashboard,
    goToDashboard,
    goToProducerDashboard,
    blockchainService,
    clearUserInfoCache,
  };
}