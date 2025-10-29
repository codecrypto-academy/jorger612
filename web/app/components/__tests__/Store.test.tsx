import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Store from '../Store';

// Mock dependencies
jest.mock('../../lib/contract', () => ({
  contractService: {
    getUserInfo: jest.fn(),
    getTokenBalance: jest.fn(),
    getUserTransfers: jest.fn(),
    getTransfer: jest.fn(),
  },
}));

jest.mock('../../lib/blockchain', () => ({
  BlockchainService: jest.fn().mockImplementation(() => ({
    getUserTokens: jest.fn().mockResolvedValue([1, 2, 3]),
    getToken: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Test Product',
      creator: '0x123',
      totalSupply: '1000',
      features: '{}',
      parentId: 0,
      dateCreated: '1234567890',
    }),
  })),
}));

describe('Store Component', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render loading state initially', () => {
    render(<Store onBack={mockOnBack} />);
    expect(screen.getByText(/Loading store/i)).toBeInTheDocument();
  });

  test('should render component', () => {
    const { container } = render(<Store onBack={mockOnBack} />);
    expect(container).toBeInTheDocument();
  });

  test('should have loading state', () => {
    render(<Store onBack={mockOnBack} />);
    // Component should render without errors
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});
