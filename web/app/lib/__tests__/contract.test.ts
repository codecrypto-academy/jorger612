import { ContractService } from '../contract';

// Mock ethers
const mockContract = {
  requestUserRole: jest.fn(),
  getUserInfo: jest.fn(),
  isAdmin: jest.fn(),
  getTokenBalance: jest.fn(),
  getUserTransfers: jest.fn(),
  getTransfer: jest.fn(),
  acceptTransfer: jest.fn(),
  rejectTransfer: jest.fn(),
  storeBuy: jest.fn(),
  getUserBuys: jest.fn(),
  getBuy: jest.fn(),
  transferCompra: jest.fn(),
};

jest.mock('ethers', () => {
  const mockProvider = {
    getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(31337) }),
    getCode: jest.fn().mockResolvedValue('0x123456'),
    getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
    getSigner: jest.fn().mockResolvedValue({
      getAddress: jest.fn().mockResolvedValue('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
    }),
  };

  return {
    ethers: {
      BrowserProvider: jest.fn().mockImplementation(() => mockProvider),
      Contract: jest.fn().mockImplementation(() => mockContract),
    },
  };
});

describe('ContractService', () => {
  let contractService: ContractService;
  let mockWindow: any;

  beforeEach(() => {
    contractService = new ContractService();
    
    // Mock window.ethereum
    mockWindow = {
      ethereum: {
        request: jest.fn().mockResolvedValue({ chainId: '0x7A69' }),
        on: jest.fn(),
        removeListener: jest.fn(),
      },
    };
    
    (global as any).window = mockWindow;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    test('should throw error if MetaMask is not installed', async () => {
      (global as any).window = {};
      
      await expect(contractService.initialize()).rejects.toThrow('MetaMask no está instalado');
    });

    test('should initialize provider and signer when MetaMask is available', async () => {
      mockWindow.ethereum.request = jest.fn().mockResolvedValue({ chainId: '0x7A69' });
      (global as any).window = mockWindow;
      
      await contractService.initialize();
      
      expect(mockWindow.ethereum).toBeDefined();
    });
  });

  describe('getTokenBalance', () => {
    test('should convert balance to number', async () => {
      // Setup: Initialize the service first
      await contractService.initialize();
      
      mockContract.getTokenBalance.mockResolvedValue(BigInt('1000'));
      
      const balance = await contractService.getTokenBalance(1, '0x123');
      expect(balance).toBe(1000);
    });
  });

  describe('getUserInfo', () => {
    test('should handle user not found error', async () => {
      await contractService.initialize();
      
      // Mock contract to throw User not found
      mockContract.getUserInfo.mockRejectedValue(new Error('User not found'));
      
      const result = await contractService.getUserInfo('0x123');
      expect(result).toBeNull();
    });

    test('should throw error for other errors', async () => {
      await contractService.initialize();
      
      mockContract.getUserInfo.mockRejectedValue(new Error('Network error'));
      
      await expect(contractService.getUserInfo('0x123')).rejects.toThrow('Error al obtener información del usuario');
    });
  });

  describe('isAdmin', () => {
    test('should return false on error', async () => {
      await contractService.initialize();
      
      mockContract.isAdmin.mockRejectedValue(new Error('Network error'));
      
      const result = await contractService.isAdmin('0x123');
      expect(result).toBe(false);
    });

    test('should return true for admin', async () => {
      await contractService.initialize();
      
      mockContract.isAdmin.mockResolvedValue(true);
      
      const result = await contractService.isAdmin('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      expect(result).toBe(true);
    });
  });
});