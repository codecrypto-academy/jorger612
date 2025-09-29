import Web3 from 'web3';

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

class Web3Service {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
  }

  async initialize() {
    try {
      console.log('Inicializando Web3...');
      console.log('URL de conexión:', RPC_URL);
      console.log('Dirección del contrato:', CONTRACT_ADDRESS);
      
      // Initialize Web3
      this.web3 = new Web3(RPC_URL);
      
      // Test connection with timeout
      console.log('Probando conexión a Anvil...');
      const isConnected = await Promise.race([
        this.web3.eth.isListening(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de conexión')), 5000))
      ]);
      
      if (!isConnected) {
        throw new Error('No se puede conectar a Anvil. Verifica que esté ejecutándose en localhost:8545');
      }
      
      console.log('✅ Conectado a Anvil exitosamente');
      
      // Get accounts
      console.log('Obteniendo cuentas...');
      const accounts = await this.web3.eth.getAccounts();
      console.log('Cuentas disponibles:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No se encontraron cuentas. Asegúrate de que Anvil tenga cuentas disponibles.');
      }
      
      this.account = accounts[0];
      console.log('✅ Cuenta conectada:', this.account);
      
      // Initialize contract
      console.log('Inicializando contrato...');
      this.contract = new this.web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      // Test contract connection
      console.log('Verificando contrato...');
      try {
        const code = await this.web3.eth.getCode(CONTRACT_ADDRESS);
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
        const users = await this.contract.methods.getAllActiveUsers().call();
        console.log('✅ Método del contrato funcionando. Usuarios encontrados:', users.length);
      } catch (methodError) {
        console.warn('Advertencia: No se pudo probar el método del contrato:', methodError.message);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error inicializando Web3:', error);
      throw error;
    }
  }

  async createUser(name, age) {
    try {
      const tx = await this.contract.methods.createUser(name, age).send({
        from: this.account,
        gas: 300000
      });
      return tx;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id, name, age) {
    try {
      const tx = await this.contract.methods.updateUser(id, name, age).send({
        from: this.account,
        gas: 300000
      });
      return tx;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      const tx = await this.contract.methods.deleteUser(id).send({
        from: this.account,
        gas: 300000
      });
      return tx;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const users = await this.contract.methods.getAllActiveUsers().call();
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
      return activeUsers;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const user = await this.contract.methods.readUser(id).call();
      return {
        id: user[0].toString(),
        name: user[1],
        age: user[2].toString(),
        isActive: user[3]
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  getAccount() {
    return this.account;
  }

  getWeb3() {
    return this.web3;
  }
}

export default new Web3Service();
