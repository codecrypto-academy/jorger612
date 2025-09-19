// Configuración del contrato y la red
export const CONTRACT_CONFIG = {
  // Dirección del contrato desplegado
  CONTRACT_ADDRESS: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  
  // URL del nodo local (Anvil)
  RPC_URL: "http://localhost:8545",
  
  // Clave privada del address que desplegó el contrato
  PRIVATE_KEY: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  
  // Address del desplegador
  DEPLOYER_ADDRESS: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  
  // ABI del contrato Storage
  CONTRACT_ABI: [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "num",
          "type": "uint256"
        }
      ],
      "name": "store",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "retrieve",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;
