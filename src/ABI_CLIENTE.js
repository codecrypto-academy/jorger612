const ABI_CLIENTE = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_dirEmpresa",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_nombre",
				"type": "string"
			}
		],
		"name": "agregarCliente",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "dirCliente",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "direccionE",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			}
		],
		"name": "ClienteAgregado",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "clientes",
		"outputs": [
			{
				"internalType": "address",
				"name": "dirCliente",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "direccionE",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_dirCliente",
				"type": "address"
			}
		],
		"name": "consultarCliente",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "consultarTodasLosClientes",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			},
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			},
			{
				"internalType": "string[]",
				"name": "",
				"type": "string[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "direccionesClientes",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export default ABI_CLIENTE;