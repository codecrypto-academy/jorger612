import { NETWORKS, BlockchainService } from '../blockchain';

describe('Blockchain Configuration', () => {
  test('Sepolia network should be configured correctly', () => {
    expect(NETWORKS.sepolia).toBeDefined();
    expect(NETWORKS.sepolia.chainId).toBe(11155111);
    expect(NETWORKS.sepolia.name).toBe('Sepolia Testnet');
  });

  test('Localhost network should be configured correctly', () => {
    expect(NETWORKS.localhost).toBeDefined();
    expect(NETWORKS.localhost.chainId).toBe(31337);
    expect(NETWORKS.localhost.name).toBe('Anvil (Localhost)');
    expect(NETWORKS.localhost.rpcUrl).toBe('http://localhost:8545');
  });

  test('BlockchainService should be instantiable', () => {
    const service = new BlockchainService();
    expect(service).toBeDefined();
    expect(service.getProvider()).toBeNull();
    expect(service.getSigner()).toBeNull();
  });
});
