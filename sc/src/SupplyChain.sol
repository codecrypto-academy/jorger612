// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    // Enums para estados de usuario y transferencias
    enum UserStatus { Pending, Approved, Rejected, Canceled }
    enum TransferStatus { Pending, Accepted, Rejected }

    // Estructura para tokens con metadatos y parentesco
    struct Token {
        uint256 id;
        address creator;
        string name;
        uint256 totalSupply;
        string features; // JSON string
        uint256 parentId;
        uint256 dateCreated;
        mapping(address => uint256) balance;
    }

    // Estructura para transferencias con aprobación
    struct Transfer {
        uint256 id;
        address from;
        address to;
        uint256 tokenId;
        uint256 dateCreated;
        uint256 amount;
        TransferStatus status;
    }

    // Estructura para usuarios con roles y estados
    struct User {
        uint256 id;
        address userAddress;
        string role;
        UserStatus status;
    }

    struct Buy {
        uint256 id;
        address from;
        uint256 quantity;
        string features; 
    }

        
         

    // Variables del contrato
// Esto es la forma más eficiente para un valor fijo.
// No usa storage, lo que ahorra gas.
    address private constant ADMIN_ADDRESS = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

    uint256 private nextTokenId = 1;
    uint256 private nextTransferId = 1;
    uint256 private nextUserId = 1;
    uint256 private nextBuyId = 1;

    // Mappings para almacenar datos
    mapping(uint256 => Token) public tokens;
    mapping(uint256 => Transfer) public transfers;
    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToUserId;
    mapping(uint256 => Buy) public buys;

    // Eventos del sistema
    event TokenCreated(uint256 indexed tokenId, address indexed creator, string name, uint256 totalSupply);
    event TransferRequested(uint256 indexed transferId, address indexed from, address indexed to, uint256 tokenId, uint256 amount);
    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, UserStatus status);

    event BuyCreated(uint256 indexed buyId,  string features);


    // Constructor - el deployer es el admin
    constructor() {
    }

    // Gestión de Usuarios

    // Solicitar rol de usuario en el sistema
    function requestUserRole(string memory role, address from) public {
        //require(addressToUserId[msg.sender] == 0, "User already registered");
        require(addressToUserId[from] == 0, "User already registered");
        require(bytes(role).length > 0, "Role cannot be empty");
        
        //users[nextUserId] = User(nextUserId, msg.sender, role, UserStatus.Pending);
        users[nextUserId] = User(nextUserId, from, role, UserStatus.Pending);
        //addressToUserId[msg.sender] = nextUserId;
        addressToUserId[from] = nextUserId;

        //emit UserRoleRequested(msg.sender, role);
        emit UserRoleRequested(from, role);
        nextUserId++;
    }

    // Cambiar estado de usuario (solo admin)
    function changeStatusUser(address userAddress, UserStatus newStatus) public {
        require(msg.sender == ADMIN_ADDRESS, "Only admin can change user status");
        require(addressToUserId[userAddress] != 0, "User not found");
        
        uint256 userId = addressToUserId[userAddress];
        users[userId].status = newStatus;
        
        emit UserStatusChanged(userAddress, newStatus);
    }

    // Obtener información de usuario
    function getUserInfo(address userAddress) public view returns (User memory) {
        require(addressToUserId[userAddress] != 0, "User not found");
        uint256 userId = addressToUserId[userAddress];
        return users[userId];
    }

    // Verificar si es admin
    function isAdmin(address userAddress) public pure returns (bool) {
        return userAddress == ADMIN_ADDRESS;
    }

    // Gestión de Tokens

    // Crear nuevo token (solo usuarios aprobados)
    function createToken(string memory name, uint totalSupply, string memory features, uint parentId) public {
        require(addressToUserId[msg.sender] != 0, "User not registered");
        uint256 userId = addressToUserId[msg.sender];
        require(users[userId].status == UserStatus.Approved, "User not approved");
        require(totalSupply > 0, "Total supply must be greater than 0");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        // Inicializar campos del token uno por uno (no se puede asignar struct con mapping directamente)
        tokens[nextTokenId].id = nextTokenId;
        tokens[nextTokenId].creator = msg.sender;
        tokens[nextTokenId].name = name;
        tokens[nextTokenId].totalSupply = totalSupply;
        tokens[nextTokenId].features = features;
        tokens[nextTokenId].parentId = parentId;
        tokens[nextTokenId].dateCreated = block.timestamp;
        tokens[nextTokenId].balance[msg.sender] = totalSupply;
        
        emit TokenCreated(nextTokenId, msg.sender, name, totalSupply);
        nextTokenId++;
    }

    // Almacenar nueva Compra (solo usuarios aprobados)
    function storeBuy(uint256 _quantity, string memory _features) public {
        require(addressToUserId[msg.sender] != 0, "User not registered");
        uint256 userId = addressToUserId[msg.sender];
        require(users[userId].status == UserStatus.Approved, "User not approved");
        
        buys[nextBuyId].id = nextBuyId;
        buys[nextBuyId].from = msg.sender;
        buys[nextBuyId].quantity = _quantity;
        buys[nextBuyId].features = _features;
        
        emit BuyCreated(nextBuyId, _features);
        nextBuyId++;
    }

    function getUserBuys(address userAddress) public view returns (uint[] memory) {
        require(addressToUserId[userAddress] != 0, "User not found");
        
        uint[] memory userBuys = new uint[](nextBuyId - 1);
        uint count = 0;
        
        for (uint i = 1; i < nextBuyId; i++) {
            userBuys[count] = i;
            count++;
        }
        
        // Redimensionar array
        uint[] memory result = new uint[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = userBuys[i];
        }
        
        return result;
    }

    // Obtener información de la compra por ID
    function getBuy(uint buyId) public view returns (
        uint256 id,
        address from,
        uint256 quantity,
        string memory features 
    ) {
        require(buys[buyId].id != 0, "Buy not found");
        return (
            buys[buyId].id,
            buys[buyId].from,
            buys[buyId].quantity,
            buys[buyId].features
        );
    }


    // Obtener información de token (sin mapping de balances)
    function getToken(uint tokenId) public view returns (
        uint256 id,
        address creator,
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId,
        uint256 dateCreated
    ) {
        require(tokens[tokenId].id != 0, "Token not found");
        return (
            tokens[tokenId].id,
            tokens[tokenId].creator,
            tokens[tokenId].name,
            tokens[tokenId].totalSupply,
            tokens[tokenId].features,
            tokens[tokenId].parentId,
            tokens[tokenId].dateCreated
        );
    }

    // Obtener balance de token para usuario
    function getTokenBalance(uint tokenId, address userAddress) public view returns (uint) {
        require(tokens[tokenId].id != 0, "Token not found");
        return tokens[tokenId].balance[userAddress];
    }

    // Gestión de Transferencias

    // Solicitar transferencia de tokens
    function transfer(address to, uint tokenId, uint amount) public {
        //require(addressToUserId[msg.sender] != 0, "User not registered");
        require(addressToUserId[to] != 0, "Recipient not registered");
        require(tokens[tokenId].id != 0, "Token not found");
        require(amount > 0, "Amount must be greater than 0");
        //require(tokens[tokenId].balance[msg.sender] >= amount, "Insufficient balance");
        //require(msg.sender != to, "Cannot transfer to self");
        
        uint256 userId = addressToUserId[msg.sender];
        require(users[userId].status == UserStatus.Approved, "User not approved");
        
        // Validar flujo de transferencia según roles
        string memory senderRole = users[userId].role;
        uint256 recipientUserId = addressToUserId[to];
        string memory recipientRole = users[recipientUserId].role;
        
        if (keccak256(bytes(senderRole)) == keccak256(bytes("Producer"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Factory")), "Producer can only transfer to Factory");
        } else if (keccak256(bytes(senderRole)) == keccak256(bytes("Factory"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Retailer")), "Factory can only transfer to Retailer");
        } else if (keccak256(bytes(senderRole)) == keccak256(bytes("Retailer"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Consumer")), "Retailer can only transfer to Consumer");
        } else {
            revert("Invalid role for transfer");
        }
        
        transfers[nextTransferId] = Transfer(nextTransferId, msg.sender, to, tokenId, block.timestamp, amount, TransferStatus.Pending);
        
        emit TransferRequested(nextTransferId, msg.sender, to, tokenId, amount);
        nextTransferId++;
    }

    // Ejecutar Compra
    function transferCompra(address from, address to, uint tokenId, uint amount) public {
        //require(addressToUserId[msg.sender] != 0, "User not registered");
        require(addressToUserId[to] != 0, "Recipient not registered");
        require(tokens[tokenId].id != 0, "Token not found");
        require(amount > 0, "Amount must be greater than 0");
        //require(tokens[tokenId].balance[msg.sender] >= amount, "Insufficient balance");
        //require(msg.sender != to, "Cannot transfer to self");
        
        uint256 userId = addressToUserId[from];
        require(users[userId].status == UserStatus.Approved, "User not approved");
        
        // Validar flujo de transferencia según roles
        string memory senderRole = users[userId].role;
        uint256 recipientUserId = addressToUserId[to];
        string memory recipientRole = users[recipientUserId].role;
        
        if (keccak256(bytes(senderRole)) == keccak256(bytes("Producer"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Factory")), "Producer can only transfer to Factory");
        } else if (keccak256(bytes(senderRole)) == keccak256(bytes("Factory"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Retailer")), "Factory can only transfer to Retailer");
        } else if (keccak256(bytes(senderRole)) == keccak256(bytes("Retailer"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Consumer")), "Retailer can only transfer to Consumer");
        } else {
            revert("Invalid role for transfer");
        }
        
        transfers[nextTransferId] = Transfer(nextTransferId, from, to, tokenId, block.timestamp, amount, TransferStatus.Accepted);
        
        emit TransferRequested(nextTransferId, from, to, tokenId, amount);
        nextTransferId++;
    }


    // Aceptar transferencia
    function acceptTransfer(uint transferId) public {
        require(transfers[transferId].id != 0, "Transfer not found");
        require(transfers[transferId].to == msg.sender, "Only recipient can accept");
        require(transfers[transferId].status == TransferStatus.Pending, "Transfer not pending");
        
        transfers[transferId].status = TransferStatus.Accepted;
        
        // Ejecutar transferencia
        tokens[transfers[transferId].tokenId].balance[transfers[transferId].from] -= transfers[transferId].amount;
        tokens[transfers[transferId].tokenId].balance[msg.sender] += transfers[transferId].amount;
        
        emit TransferAccepted(transferId);
    }

    // Rechazar transferencia
    function rejectTransfer(uint transferId) public {
        require(transfers[transferId].id != 0, "Transfer not found");
        require(transfers[transferId].to == msg.sender, "Only recipient can reject");
        require(transfers[transferId].status == TransferStatus.Pending, "Transfer not pending");
        
        transfers[transferId].status = TransferStatus.Rejected;
        
        emit TransferRejected(transferId);
    }

    // Obtener información de transferencia
    function getTransfer(uint transferId) public view returns (Transfer memory) {
        require(transfers[transferId].id != 0, "Transfer not found");
        return transfers[transferId];
    }

    // Funciones auxiliares

    // Obtener tokens de un usuario
    function getUserTokens(address userAddress) public view returns (uint[] memory) {
        require(addressToUserId[userAddress] != 0, "User not found");
        
        uint[] memory userTokens = new uint[](nextTokenId - 1);
        uint count = 0;
        
        for (uint i = 1; i < nextTokenId; i++) {
            if (tokens[i].balance[userAddress] > 0) {
                userTokens[count] = i;
                count++;
            }
        }
        
        // Redimensionar array
        uint[] memory result = new uint[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = userTokens[i];
        }
        
        return result;
    }

    // Obtener transferencias de un usuario
    function getUserTransfers(address userAddress) public view returns (uint[] memory) {
        require(addressToUserId[userAddress] != 0, "User not found");
        
        uint[] memory userTransfers = new uint[](nextTransferId - 1);
        uint count = 0;
        
        for (uint i = 1; i < nextTransferId; i++) {
            if (transfers[i].from == userAddress || transfers[i].to == userAddress) {
                userTransfers[count] = i;
                count++;
            }
        }
        
        // Redimensionar array
        uint[] memory result = new uint[](count);
        for (uint i = 0; i < count; i++) {
            result[i] = userTransfers[i];
        }
        
        return result;
    }
}
