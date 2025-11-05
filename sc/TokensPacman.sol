// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TokensPacman {
    // El 'creator' es la cuenta de Anvil 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    address public immutable creator;
    uint256 public totalSupply;
    mapping(address => uint256) private balances;

    string public name = "TokensPacman";
    string public symbol = "TKP";
    uint8 public decimals = 0;

    // --- ESTRUCTURAS DE DATOS PARA EL HISTORIAL ---

    // Estructura para almacenar los detalles de cada transferencia
    struct TransferRecord {
        address from;
        address to;      // Añadido 'to' para saber quién recibió
        uint256 amount;
        uint256 timestamp;
    }

    // Historial de transferencias RECIBIDAS (que SUMAN): address 'to' => array de TransferRecord
    mapping(address => TransferRecord[]) private transfersTo; 

    // Historial de transferencias ENVIADAS (que RESTAN): address 'from' => array de TransferRecord
    mapping(address => TransferRecord[]) private transfersFrom; // <-- NUEVO

    // --- RESTO DEL CONTRATO ---

    // Evento para rastrear transferencias (práctica estándar ERC-20)
    event Transfer(address indexed from, address indexed to, uint256 value);

    // El constructor se ejecuta una vez al desplegar el contrato
    constructor(uint256 initialSupply) {
        // Almacenar la dirección del creador al desplegar
        creator = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; 
        totalSupply = initialSupply;
        // Asignar el suministro inicial al creador
        balances[creator] = initialSupply;
        emit Transfer(address(0), creator, initialSupply);
    }
    
    // Función de ayuda para asegurar que solo el creador puede llamar a una función
    modifier onlyCreator() {
        require(msg.sender == creator, "Solo el creador puede llamar a esta funcion.");
        _;
    }

    // 3) Función para consultar el balance de una cuenta
    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    // Función auxiliar para registrar la transferencia
    function _recordTransfer(address _from, address _to, uint256 _amount) internal {
        TransferRecord memory record = TransferRecord({
            from: _from,
            to: _to,
            amount: _amount,
            timestamp: block.timestamp
        });
        
        // 1. Registrar la transferencia en el historial de la cuenta receptora ('to') - SUMA
        transfersTo[_to].push(record);
        
        // 2. Registrar la transferencia en el historial de la cuenta emisora ('from') - RESTA
        transfersFrom[_from].push(record);
    }

    // 1) Función para que la cuenta creadora transfiera tokens a otras cuentas
    function transferFromCreator(address to, uint256 amount) public onlyCreator returns (bool) {
        require(to != address(0), "Transferencia a direccion cero no permitida");
        require(balances[creator] >= amount, "El creador no tiene suficientes tokens");

        balances[creator] -= amount;
        balances[to] += amount;
        
        emit Transfer(creator, to, amount);
        _recordTransfer(creator, to, amount);
        return true;
    }

    // 2) Función donde haya transferencia entre cuentas (estándar ERC-20 `transfer`)
    function transfer(address to, uint256 amount) public returns (bool) {
        address owner = msg.sender;
        
        require(to != address(0), "Transferencia a direccion cero no permitida");
        require(balances[owner] >= amount, "Saldo insuficiente");

        balances[owner] -= amount;
        balances[to] += amount;
        
        emit Transfer(owner, to, amount);
        _recordTransfer(owner, to, amount);
        return true;
    }

    // --- FUNCIONES DE CONSULTA DE HISTORIAL ---
    
    // Función original: Consulta transferencias recibidas (que suman al balance)
    function getTransfer(address _to) public view returns (TransferRecord[] memory) {
        return transfersTo[_to];
    }
    
    // NUEVA FUNCIÓN: Consulta transferencias enviadas (que restan al balance)
    function getTransferFrom(address _from) public view returns (TransferRecord[] memory) {
        return transfersFrom[_from];
    }
}