const ABI_PRODUCTOS = [
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
			},
			{
				"internalType": "uint256",
				"name": "_precio",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_pathImagen",
				"type": "string"
			}
		],
		"name": "agregarProducto",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "idProducto",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "dirEmpresa",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "precio",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "pathImagen",
				"type": "string"
			}
		],
		"name": "ProductoAgregado",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "consultarTodosLosProductos",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
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
			},
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
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
		"name": "identificadorProductos",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
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
		"name": "productos",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "idProducto",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "dirEmpresa",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "precio",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "pathImagen",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

export default ABI_PRODUCTOS;
