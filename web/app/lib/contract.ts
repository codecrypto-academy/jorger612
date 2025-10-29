import { ethers } from 'ethers';
import ABI from '../ABI.json';

// Get contract address from environment variable
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const RPC_URL = 'http://localhost:8545';

if (!CONTRACT_ADDRESS) {
  console.warn('⚠️ NEXT_PUBLIC_CONTRACT_ADDRESS not set in environment variables');
}

export class ContractService {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  async initialize() {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    
    // Verificar la red
    const network = await this.provider.getNetwork();
    
    // Verificar que estamos en la red correcta (localhost: 31337)
    if (Number(network.chainId) !== 31337) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }], // 31337 in hex
        });
        // Re-inicializar después del cambio de red
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
      } catch (switchError: any) {
        // Si la red no existe, agregarla
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x7A69', // 31337 in hex
                chainName: 'Anvil Localhost',
                rpcUrls: ['http://localhost:8545'],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: null,
              }],
            });
          } catch (addError: any) {
            console.error('❌ Failed to add localhost network:', addError);
            throw new Error(`No se pudo agregar la red localhost. Error: ${addError.message}`);
          }
        } else {
          throw new Error(`No se pudo cambiar a la red localhost. Error: ${switchError.message}`);
        }
      }
    }
    
    // Verificar que el contrato existe
    const code = await this.provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      throw new Error(`No hay contrato desplegado en la dirección ${CONTRACT_ADDRESS}`);
    }
    
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.signer);
  }

  async refreshSigner() {
    if (!this.provider) {
      await this.initialize();
      return;
    }
    
    this.signer = await this.provider.getSigner();
    
    if (this.contract) {
      // Recrear el contrato con el nuevo signer
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.signer);
    }
  }

  async requestUserRole(role: string, fromAddress: string) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      // Intentar primero con un solo parámetro (rol)
      let tx;
      try {
        tx = await this.contract.requestUserRole(role);
      } catch (singleParamError: any) {
        // Si falla con un parámetro, intentar con dos
        tx = await this.contract.requestUserRole(role, fromAddress);
      }
      
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      // Si el error es "User already registered", no es realmente un error
      if (error.message && error.message.includes('User already registered')) {
        // Retornar un hash simulado para indicar que el usuario ya está registrado
        return 'already-registered';
      }
      
      console.error('Error in requestUserRole:', error.message || error);
      
      throw new Error(`Error al solicitar rol: ${error.message || error}`);
    }
  }

  async getUserInfo(userAddress: string) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const userInfo = await this.contract.getUserInfo(userAddress);
      return userInfo;
    } catch (error: any) {
      // Si el error es "User not found", no es un error real, es la respuesta esperada
      if (error.message && error.message.includes('User not found')) {
        return null;
      }
      
      // Para otros errores reales, lanzar la excepción normalmente
      throw new Error(`Error al obtener información del usuario: ${error.message}`);
    }
  }

  async isAdmin(userAddress: string): Promise<boolean> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const isAdminResult = await this.contract.isAdmin(userAddress);
      return isAdminResult;
    } catch (error: any) {
      console.error('Error in isAdmin:', error);
      // Si hay error, asumir que no es admin por seguridad
      return false;
    }
  }

  async changeStatusUser(userAddress: string, newStatus: number) {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const tx = await this.contract.changeStatusUser(userAddress, newStatus);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      throw new Error(`Error al cambiar status del usuario: ${error}`);
    }
  }

  async getTokenBalance(tokenId: number, userAddress: string): Promise<number> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const balance = await this.contract.getTokenBalance(tokenId, userAddress);
      return Number(balance);
    } catch (error: any) {
      console.error('Error in getTokenBalance:', error);
      throw new Error(`Error al obtener balance del token: ${error.message}`);
    }
  }

  async getUserTransfers(userAddress: string): Promise<any[]> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const transfers = await this.contract.getUserTransfers(userAddress);
      return transfers;
    } catch (error: any) {
      console.error('Error in getUserTransfers:', error);
      throw new Error(`Error al obtener transferencias del usuario: ${error.message}`);
    }
  }

  async getTransfer(transferId: number): Promise<any> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const transfer = await this.contract.getTransfer(transferId);
      return transfer;
    } catch (error: any) {
      console.error('Error in getTransfer:', error);
      throw new Error(`Error al obtener transferencia: ${error.message}`);
    }
  }

  async acceptTransfer(transferId: number): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const tx = await this.contract.acceptTransfer(transferId);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Error in acceptTransfer:', error);
      throw new Error(`Error al aceptar transferencia: ${error.message}`);
    }
  }

  async rejectTransfer(transferId: number): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const tx = await this.contract.rejectTransfer(transferId);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Error in rejectTransfer:', error);
      throw new Error(`Error al rechazar transferencia: ${error.message}`);
    }
  }

  async storeBuy(quantity: number, features: string): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const tx = await this.contract.storeBuy(quantity, features);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Error in storeBuy:', error);
      throw new Error(`Error al procesar compra: ${error.message}`);
    }
  }

  async getUserBuys(userAddress: string): Promise<number[]> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const buyIds = await this.contract.getUserBuys(userAddress);
      return buyIds.map((id: any) => Number(id));
    } catch (error: any) {
      console.error('Error in getUserBuys:', error);
      throw new Error(`Error al obtener compras del usuario: ${error.message}`);
    }
  }

  async getBuy(buyId: number): Promise<any> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const buy = await this.contract.getBuy(buyId);
      return buy;
    } catch (error: any) {
      console.error('Error in getBuy:', error);
      throw new Error(`Error al obtener compra: ${error.message}`);
    }
  }

  async transferCompra(from: string, to: string, tokenId: number, amount: number): Promise<string> {
    if (!this.contract) {
      await this.initialize();
    }

    if (!this.contract) {
      throw new Error('No se pudo inicializar el contrato');
    }

    try {
      const tx = await this.contract.transferCompra(from, to, tokenId, amount);
      await tx.wait();
      return tx.hash;
    } catch (error: any) {
      console.error('Error in transferCompra:', error);
      throw new Error(`Error al transferir compra: ${error.message}`);
    }
  }

}

export const contractService = new ContractService();

