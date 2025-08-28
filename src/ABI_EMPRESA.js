const ABI_EMPRESA = [
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_nombre",
				"type": "string"
			}
		],
		"name": "agregarEmpresa",
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
				"name": "direccion",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "nombre",
				"type": "string"
			}
		],
		"name": "EmpresaAgregada",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_direccion",
				"type": "address"
			}
		],
		"name": "consultarEmpresa",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "consultarTodasLasEmpresas",
		"outputs": [
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
		"name": "direccionesEmpresas",
		"outputs": [
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
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "empresas",
		"outputs": [
			{
				"internalType": "address",
				"name": "direccion",
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
	}
];

export default ABI_EMPRESA;