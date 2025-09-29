import { ethers } from 'ethers';

// Contract ABI - Actualizado para coincidir con el contrato real
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_age",
        "type": "uint256"
      }
    ],
    "name": "createUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "deleteUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_name",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_age",
        "type": "uint256"
      }
    ],
    "name": "updateUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "age",
        "type": "uint256"
      }
    ],
    "name": "UserCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "UserDeleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "age",
        "type": "uint256"
      }
    ],
    "name": "UserUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getAllActiveUsers",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "age",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          }
        ],
        "internalType": "struct userCrud.User[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "readUser",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract configuration
const CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const RPC_URL = 'http://127.0.0.1:8545';

class EthersService {
  constructor() {
    this.provider = null;
    this.contract = null;
    this.signer = null;
    this.account = null;
  }

  async initialize() {
    try {
      console.log('Inicializando Ethers.js...');
      console.log('URL de conexión:', RPC_URL);
      console.log('Dirección del contrato:', CONTRACT_ADDRESS);
      
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Test connection
      console.log('Probando conexión a Anvil...');
      const network = await this.provider.getNetwork();
      console.log('✅ Red conectada:', network.name, 'Chain ID:', network.chainId.toString());
      
      // Get accounts
      console.log('Obteniendo cuentas...');
      const accounts = await this.provider.listAccounts();
      console.log('Cuentas disponibles:', accounts.length);
      
      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas. Asegúrate de que Anvil tenga cuentas disponibles.');
      }
      
      // Use first account as signer
      this.signer = await this.provider.getSigner(0);
      this.account = await this.signer.getAddress();
      console.log('✅ Cuenta conectada:', this.account);
      
      // Initialize contract
      console.log('Inicializando contrato...');
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      
      // Test contract connection
      console.log('Verificando contrato...');
      try {
        const code = await this.provider.getCode(CONTRACT_ADDRESS);
        console.log('Código del contrato obtenido:', code.substring(0, 20) + '...');
        
        if (code === '0x') {
          throw new Error('No se encontró código en la dirección del contrato. Verifica que esté desplegado correctamente.');
        }
        console.log('✅ Contrato encontrado y conectado exitosamente');
      } catch (contractError) {
        console.error('Error verificando contrato:', contractError);
        throw new Error('Error al conectar con el contrato inteligente. Verifica la dirección: ' + CONTRACT_ADDRESS);
      }
      
      // Test contract method
      console.log('Probando método del contrato...');
      try {
        const users = await this.contract.getAllActiveUsers();
        console.log('✅ Método del contrato funcionando. Usuarios encontrados:', users.length);
      } catch (methodError) {
        console.warn('Advertencia: No se pudo probar el método del contrato:', methodError.message);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Ethers.js:', error);
      throw error;
    }
  }

  async createUser(name, age) {
    try {
      console.log('Creando usuario:', name, age);
      const tx = await this.contract.createUser(name, age, {
        gasLimit: 300000
      });
      
      console.log('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transacción confirmada:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id, name, age) {
    try {
      console.log('Actualizando usuario:', id, name, age);
      const tx = await this.contract.updateUser(id, name, age, {
        gasLimit: 300000
      });
      
      console.log('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transacción confirmada:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      console.log('Eliminando usuario:', id);
      const tx = await this.contract.deleteUser(id, {
        gasLimit: 300000
      });
      
      console.log('Transacción enviada:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transacción confirmada:', receipt);
      
      return receipt;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      console.log('Obteniendo todos los usuarios...');
      const users = await this.contract.getAllActiveUsers();
      
      // Filtrar usuarios activos y mapear correctamente
      const activeUsers = [];
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (user.isActive) {
          activeUsers.push({
            id: user.id.toString(),
            name: user.name,
            age: user.age.toString(),
            isActive: user.isActive
          });
        }
      }
      
      console.log('Usuarios obtenidos:', activeUsers.length);
      return activeUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      console.log('Obteniendo usuario por ID:', id);
      const user = await this.contract.readUser(id);
      
      const userData = {
        id: user[0].toString(),
        name: user[1],
        age: user[2].toString(),
        isActive: user[3]
      };
      
      console.log('Usuario obtenido:', userData);
      return userData;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  getAccount() {
    return this.account;
  }

  getProvider() {
    return this.provider;
  }

  getContract() {
    return this.contract;
  }
}

export default new EthersService();
