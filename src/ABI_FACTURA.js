const ABI_FACTURA = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_dirEmpresa",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "_dirCliente",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_feFactura",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "_totFactura",
				"type": "uint256"
			}
		],
		"name": "agregarFactura",
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
				"name": "dirEmpresa",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "numFactura",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "feFactura",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "dirCliente",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totFactura",
				"type": "uint256"
			}
		],
		"name": "FacturaAgregada",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_numFactura",
				"type": "uint256"
			}
		],
		"name": "consultarFactura",
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
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "consultarTodasLasFacturas",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
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
		"name": "consultarTodasLasFacturasXcliente",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
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
		"name": "facturas",
		"outputs": [
			{
				"internalType": "address",
				"name": "dirEmpresa",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "numFactura",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "feFactura",
				"type": "string"
			},
			{
				"internalType": "address",
				"name": "dirCliente",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "totFactura",
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
		"name": "numerosFacturas",
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
export default ABI_FACTURA;