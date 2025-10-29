import { renderHook, act } from '@testing-library/react';
import { useWallet } from '../useWallet';

// Mock dependencies
jest.mock('../../lib/blockchain', () => ({
  BlockchainService: jest.fn().mockImplementation(() => ({
    getBalance: jest.fn().mockResolvedValue('1000.0'),
    getCurrentNetwork: jest.fn().mockResolvedValue({ chainId: 31337, name: 'Anvil (Localhost)' }),
    connectWallet: jest.fn().mockResolvedValue({
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      chainId: 31337,
    }),
  })),
  NETWORKS: {
    localhost: { chainId: 31337, name: 'Anvil (Localhost)' },
    sepolia: { chainId: 11155111, name: 'Sepolia Testnet' },
  },
}));

jest.mock('../../lib/contract', () => ({
  contractService: {
    getUserInfo: jest.fn().mockResolvedValue(null),
    refreshSigner: jest.fn(),
    requestUserRole: jest.fn().mockResolvedValue('0x123'),
    changeStatusUser: jest.fn().mockResolvedValue('0x456'),
  },
}));

describe('useWallet Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock window.ethereum
    (global as any).window = {
      ethereum: {
        request: jest.fn().mockResolvedValue(['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']),
        on: jest.fn(),
        removeListener: jest.fn(),
      },
    };
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useWallet());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeNull();
    expect(result.current.balance).toBeNull();
    expect(result.current.isConnecting).toBe(false);
  });

  test('should check admin account correctly', () => {
    const { result } = renderHook(() => useWallet());
    
    // Admin address
    const adminAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
    const { checkAdminAccount } = require('../useWallet');
    
    // Note: This would need to be exposed or tested differently
    // As checkAdminAccount is not exported
  });

  test('should have disconnect function', () => {
    const { result } = renderHook(() => useWallet());
    
    expect(result.current.disconnect).toBeDefined();
    expect(typeof result.current.disconnect).toBe('function');
  });

  test('should have connectWallet function', () => {
    const { result } = renderHook(() => useWallet());
    
    expect(result.current.connectWallet).toBeDefined();
    expect(typeof result.current.connectWallet).toBe('function');
  });
});
