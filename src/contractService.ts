import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from './config';

/**
 * Servicio para interactuar con el contrato Storage
 */
export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    // Crear el proveedor para conectarse a la red local
    this.provider = new ethers.JsonRpcProvider(CONTRACT_CONFIG.RPC_URL);
    
    // Crear la wallet con la clave privada
    this.wallet = new ethers.Wallet(CONTRACT_CONFIG.PRIVATE_KEY, this.provider);
    
    // Crear la instancia del contrato
    this.contract = new ethers.Contract(
      CONTRACT_CONFIG.CONTRACT_ADDRESS,
      CONTRACT_CONFIG.CONTRACT_ABI,
      this.wallet
    );
  }

  /**
   * Obtiene el balance del address desplegador
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(CONTRACT_CONFIG.DEPLOYER_ADDRESS);
    return ethers.formatEther(balance);
  }

  /**
   * Almacena un número en el contrato
   * @param num Número a almacenar
   */
  async storeNumber(num: number): Promise<string> {
    try {
      console.log(`Almacenando el número: ${num}`);
      
      // Enviar la transacción
      const tx = await this.contract.store(num);
      console.log(`Transacción enviada: ${tx.hash}`);
      
      // Esperar a que se confirme
      const receipt = await tx.wait();
      console.log(`Transacción confirmada en el bloque: ${receipt.blockNumber}`);
      
      return tx.hash;
    } catch (error) {
      console.error('Error al almacenar el número:', error);
      throw error;
    }
  }

  /**
   * Recupera el número almacenado en el contrato
   */
  async retrieveNumber(): Promise<number> {
    try {
      console.log('Recuperando el número almacenado...');
      
      const number = await this.contract.retrieve();
      console.log(`Número recuperado: ${number.toString()}`);
      
      return Number(number.toString());
    } catch (error) {
      console.error('Error al recuperar el número:', error);
      throw error;
    }
  }

  /**
   * Obtiene información del contrato
   */
  async getContractInfo(): Promise<{
    address: string;
    balance: string;
    deployerAddress: string;
  }> {
    const balance = await this.getBalance();
    
    return {
      address: CONTRACT_CONFIG.CONTRACT_ADDRESS,
      balance,
      deployerAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS
    };
  }

  /**
   * Verifica la conexión con la red
   */
  async checkConnection(): Promise<boolean> {
    try {
      const network = await this.provider.getNetwork();
      console.log(`Conectado a la red: ${network.name} (Chain ID: ${network.chainId})`);
      return true;
    } catch (error) {
      console.error('Error de conexión:', error);
      return false;
    }
  }
}
