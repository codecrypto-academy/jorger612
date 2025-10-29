import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import MyTokens from '../MyTokens';

// Mock dependencies
jest.mock('../../lib/contract', () => ({
  contractService: {
    getUserTransfers: jest.fn().mockResolvedValue([]),
    getTransfer: jest.fn(),
    getTokenBalance: jest.fn().mockResolvedValue(100),
  },
}));

jest.mock('../../lib/blockchain', () => ({
  BlockchainService: jest.fn().mockImplementation(() => ({
    getUserTokens: jest.fn().mockResolvedValue([1, 2]),
    getToken: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Token',
      creator: '0x123',
      totalSupply: '1000',
      features: '{}',
      parentId: 0,
      dateCreated: '1234567890',
    }),
  })),
}));

jest.mock('../../contexts/WalletContext', () => ({
  useWallet: jest.fn(() => ({
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    blockchainService: new (require('../../lib/blockchain').BlockchainService)(),
    selectedRole: { id: 'producer', name: 'Producer' },
  })),
}));

describe('MyTokens Component', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render loading state initially', () => {
    render(<MyTokens onBack={mockOnBack} />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  test('should render back button', () => {
    render(<MyTokens onBack={mockOnBack} />);
    const backButton = screen.getByText(/Back/i);
    expect(backButton).toBeInTheDocument();
  });

  test('should display My Tokens title', () => {
    render(<MyTokens onBack={mockOnBack} />);
    // Wait for loading to finish
    waitFor(() => {
      expect(screen.getByText(/My Tokens/i)).toBeInTheDocument();
    });
  });
});
