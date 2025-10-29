import { ethers, BrowserProvider, Contract } from 'ethers';
import ABI from '../ABI.json';

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl?: string;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  localhost: {
    chainId: 31337,
    name: 'Anvil (Localhost)',
    rpcUrl: 'http://localhost:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
  },
};

// Contract addresses for different networks
// Get contract address from environment variable for localhost
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export const CONTRACT_ADDRESSES: Record<string, string> = {
  localhost: CONTRACT_ADDRESS, // Deployed contract address from environment variable
  sepolia: '', // Add when deployed to Sepolia
};

export class BlockchainService {
  private provider: BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  // Método para reinicializar el provider
  private async refreshProvider(): Promise<void> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    // Crear nuevo provider para evitar errores de cambio de red
    this.provider = new BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
  }

  async connectWallet(): Promise<{ address: string; chainId: number }> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Inicializar provider
      await this.refreshProvider();

      const network = await this.provider!.getNetwork();
      const chainId = Number(network.chainId);

      return {
        address: accounts[0],
        chainId,
      };
    } catch (error: any) {
      throw new Error(`Error conectando wallet: ${error.message}`);
    }
  }

  async switchNetwork(networkKey: keyof typeof NETWORKS): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    const network = NETWORKS[networkKey];
    const chainIdHex = `0x${network.chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        await this.addNetwork(networkKey);
      } else {
        throw error;
      }
    }
  }

  private async addNetwork(networkKey: keyof typeof NETWORKS): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    const network = NETWORKS[networkKey];
    const chainIdHex = `0x${network.chainId.toString(16)}`;

    const params: any = {
      chainId: chainIdHex,
      chainName: network.name,
      rpcUrls: [network.rpcUrl || ''],
    };

    if (networkKey === 'localhost') {
      params.nativeCurrency = {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      };
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [params],
    });
  }

  async getCurrentNetwork(): Promise<NetworkConfig | null> {
    try {
      // Refrescar provider para evitar errores de cambio de red
      await this.refreshProvider();

      if (!this.provider) {
        return null;
      }

      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);

      // Find the network in our config
      for (const [key, config] of Object.entries(NETWORKS)) {
        if (config.chainId === chainId) {
          return config;
        }
      }
      return {
        chainId,
        name: 'Unknown Network',
      };
    } catch (error: any) {
      console.error('❌ Error getting current network:', error);
      return null;
    }
  }

  getProvider(): BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  async getBalance(address: string): Promise<string> {
    try {
      // Refrescar provider para evitar errores de cambio de red
      await this.refreshProvider();

      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error: any) {
      console.error('Error getting balance:', error);
      // Retornar 0 en caso de error en lugar de lanzar excepción
      return '0';
    }
  }

  async getCurrentAddress(): Promise<string> {
    try {
      await this.refreshProvider();

      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const address = await this.signer.getAddress();
      return address;
    } catch (error: any) {
      console.error('Error getting current address:', error);
      throw new Error(`Failed to get current address: ${error.message}`);
    }
  }

  private async getContractAddress(): Promise<string> {
    const network = await this.getCurrentNetwork();
    if (!network) {
      throw new Error('No network connected');
    }

    const networkKey = Object.keys(NETWORKS).find(
      key => NETWORKS[key].chainId === network.chainId
    );

    if (!networkKey || !CONTRACT_ADDRESSES[networkKey]) {
      throw new Error(`Contract not deployed on network ${network.name || 'Unknown'}`);
    }
    return CONTRACT_ADDRESSES[networkKey];
  }

  private async getContract(): Promise<Contract> {
    if (!this.signer) {
      throw new Error('Signer not initialized');
    }

    const contractAddress = await this.getContractAddress();
    return new Contract(contractAddress, ABI, this.signer);
  }

  async createToken(
    name: string,
    totalSupply: string,
    features: string,
    parentId: number = 1 // Default to admin ID (1)
  ): Promise<{ hash: string; tokenId?: number }> {
    try {
      await this.refreshProvider();

      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const contract = await this.getContract();
      const totalSupplyBigInt = BigInt(totalSupply);

      // Call the createToken function
      const tx = await contract.createToken(
        name,
        totalSupplyBigInt,
        features,
        parentId
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Get the token ID from the event
      let tokenId: number | undefined;
      if (receipt?.logs) {
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog(log);
            if (parsedLog && parsedLog.name === 'TokenCreated') {
              tokenId = Number(parsedLog.args.tokenId);
              break;
            }
          } catch (e) {
            // Continue to next log if parsing fails
          }
        }
      }

      return {
        hash: tx.hash,
        tokenId
      };
    } catch (error: any) {
      console.error('Error creating token:', error);
      throw new Error(`Failed to create token: ${error.message}`);
    }
  }

  async getToken(tokenId: number): Promise<any> {
    try {
      await this.refreshProvider();

      const contract = await this.getContract();
      const token = await contract.getToken(tokenId);
      
      // 🔍 DEBUG: Ver qué devuelve el smart contract
      
      return {
        id: Number(token.id),
        creator: token.creator,
        name: token.name,
        totalSupply: token.totalSupply.toString(),
        features: token.features,
        parentId: Number(token.parentId),
        dateCreated: Number(token.dateCreated)
      };
    } catch (error: any) {
      console.error('Error getting token:', error);
      throw new Error(`Failed to get token: ${error.message}`);
    }
  }

  async getUserTokens(userAddress: string): Promise<number[]> {
    try {
      await this.refreshProvider();

      const contract = await this.getContract();
      const tokenIds = await contract.getUserTokens(userAddress);
      
      return tokenIds.map((id: any) => Number(id));
    } catch (error: any) {
      console.error('Error getting user tokens:', error);
      throw new Error(`Failed to get user tokens: ${error.message}`);
    }
  }

  async transfer(to: string, tokenId: number, amount: number): Promise<{ hash: string }> {
    try {
      await this.refreshProvider();

      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const contract = await this.getContract();
      
      // Call the transfer function
      const tx = await contract.transfer(to, tokenId, amount);
      
      // Wait for transaction confirmation
      await tx.wait();
      
      return { hash: tx.hash };
    } catch (error: any) {
      console.error('❌ Error in transfer:', error);
      throw new Error(`Transfer failed: ${error.message || error}`);
    }
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
