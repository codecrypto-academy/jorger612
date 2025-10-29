// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol"; // Asegurate de ajustar la ruta si es necesario

// Direccion de la cuenta predeterminada de Foundry (admin simulado)
address constant ADMIN_KEY = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

contract SupplyChainTest is Test {
    SupplyChain supplyChain;

    // Direcciones simuladas para los diferentes roles
    address producer = address(0x101);
    address factory = address(0x202);
    address retailer = address(0x303);
    address consumer = address(0x404);
    address unapprovedUser = address(0x505);
    address notRegisteredUser = address(0x606);
    address admin = ADMIN_KEY; // Usamos la constante del contrato

    // --- Setup y configuracion inicial ---

    function setUp() public {
        supplyChain = new SupplyChain();

        // 1. Registrar a los usuarios (Pasan a estado PENDING)
        vm.prank(producer);
        supplyChain.requestUserRole("Producer", producer);
        vm.prank(factory);
        supplyChain.requestUserRole("Factory", factory);
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer", retailer);
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer", consumer);
        vm.prank(unapprovedUser);
        supplyChain.requestUserRole("Unapproved", unapprovedUser);

        // 2. Aprobar a los usuarios clave (Solo admin)
        vm.prank(admin);
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        vm.prank(admin);
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        vm.prank(admin);
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        vm.prank(admin);
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
    }

    // --- Tests de gestion de usuarios ---

    function testUserRegistration() public {
        address newUser = address(0x707);
        vm.prank(newUser);
        supplyChain.requestUserRole("NewRole", newUser);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(newUser);
        assertEq(user.userAddress, newUser, "La direccion del usuario no es correcta");
        assertEq(keccak256(bytes(user.role)), keccak256(bytes("NewRole")), "El rol no es correcto");
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Pending), "El estado inicial no es Pending");
    }

    function testAdminApproveUser() public {
        // El unapprovedUser ya esta en Pending
        vm.prank(admin);
        supplyChain.changeStatusUser(unapprovedUser, SupplyChain.UserStatus.Approved);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(unapprovedUser);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Approved), "El usuario deberia estar Approved");
    }

    function testAdminRejectUser() public {
        // El unapprovedUser ya esta en Pending
        vm.prank(admin);
        supplyChain.changeStatusUser(unapprovedUser, SupplyChain.UserStatus.Rejected);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(unapprovedUser);
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Rejected), "El usuario deberia estar Rejected");
    }

    function testUserStatusChanges() public {
        // Cambiar a Approved y luego a Canceled
        vm.prank(admin);
        supplyChain.changeStatusUser(unapprovedUser, SupplyChain.UserStatus.Approved);
        SupplyChain.User memory userApproved = supplyChain.getUserInfo(unapprovedUser);
        assertEq(uint256(userApproved.status), uint256(SupplyChain.UserStatus.Approved), "El estado deberia ser Approved");

        vm.prank(admin);
        supplyChain.changeStatusUser(unapprovedUser, SupplyChain.UserStatus.Canceled);
        SupplyChain.User memory userCanceled = supplyChain.getUserInfo(unapprovedUser);
        assertEq(uint256(userCanceled.status), uint256(SupplyChain.UserStatus.Canceled), "El estado deberia ser Canceled");
    }

    function testOnlyApprovedUsersCanOperate() public {
        // El unapprovedUser ya esta en Pending del setUp
        string memory name = "TestItem";
        uint totalSupply = 100;
        string memory features = "{}";
        uint parentId = 0;

        // Debe fallar si el usuario no esta aprobado
        vm.prank(unapprovedUser);
        vm.expectRevert("User not approved");
        supplyChain.createToken(name, totalSupply, features, parentId);
    }

    function testGetUserInfo() public {
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer, "La direccion de usuario no coincide");
        assertEq(keccak256(bytes(user.role)), keccak256(bytes("Producer")), "El rol no coincide");
        assertEq(uint256(user.status), uint256(SupplyChain.UserStatus.Approved), "El estado no coincide");

        // Caso no registrado
        vm.expectRevert("User not found");
        supplyChain.getUserInfo(notRegisteredUser);
    }

    function testIsAdmin() public {
        assertTrue(supplyChain.isAdmin(admin), "La direccion del admin deberia ser reconocida como admin");
        assertFalse(supplyChain.isAdmin(producer), "Una direccion no admin no deberia ser reconocida como admin");
    }

    // --- Tests de creacion de tokens ---

    function testCreateTokenByProducer() public {
        vm.prank(producer);
        supplyChain.createToken("RawMaterial", 1000, '{"origin":"Farm"}', 0);
        
        uint[] memory tokens = supplyChain.getUserTokens(producer);
        assertEq(tokens.length, 1, "El Producer debe tener 1 token");
        assertEq(supplyChain.getTokenBalance(1, producer), 1000, "El balance inicial debe ser el totalSupply");
    }

    function testCreateTokenByFactory() public {
        // El Factory puede crear tokens (asumiendo que tiene la capacidad)
        vm.prank(factory);
        supplyChain.createToken("IntermediateProduct", 500, '{"process":"Assembly"}', 0);

        uint[] memory tokens = supplyChain.getUserTokens(factory);
        assertEq(tokens.length, 1, "El Factory debe tener 1 token");
    }
    
    function testCreateTokenByRetailer() public {
        // El Retailer puede crear tokens (ej. un paquete o lote final)
        vm.prank(retailer);
        supplyChain.createToken("FinalBatch", 200, '{"packaging":"Box"}', 0);

        uint[] memory tokens = supplyChain.getUserTokens(retailer);
        assertEq(tokens.length, 1, "El Retailer debe tener 1 token");
    }

    function testTokenWithParentId() public {
        // 1. Producer crea materia prima (Token 1)
        vm.prank(producer);
        supplyChain.createToken("RawMaterial", 1000, '{"origin":"Farm"}', 0);

        // 2. Factory crea producto intermedio (Token 2) con parentId 1
        vm.prank(factory);
        supplyChain.createToken("Component", 500, '{"process":"Cutting"}', 1);

        (uint256 id, , , , , uint256 parentId, ) = supplyChain.getToken(2);
        assertEq(id, 2, "El ID del token deberia ser 2");
        assertEq(parentId, 1, "El parentId debe ser 1");
    }

    function testTokenMetadata() public {
        string memory expectedFeatures = '{"color":"blue", "weight":10}';
        vm.prank(producer);
        supplyChain.createToken("FancyItem", 50, expectedFeatures, 0);

        (, , , , string memory features, , ) = supplyChain.getToken(1);
        assertEq(keccak256(bytes(features)), keccak256(bytes(expectedFeatures)), "Los metadatos no coinciden");
    }

    function testTokenBalance() public {
        uint totalSupply = 75;
        vm.prank(producer);
        supplyChain.createToken("SmallBatch", totalSupply, "", 0);

        assertEq(supplyChain.getTokenBalance(1, producer), totalSupply, "El balance del creator debe ser el totalSupply");
        assertEq(supplyChain.getTokenBalance(1, factory), 0, "El balance de otro usuario debe ser 0");
    }

    function testGetToken() public {
        vm.prank(producer);
        supplyChain.createToken("Gold", 10, "Precious", 0);

        (uint256 id, address creator, string memory name, uint256 totalSupply, , , ) = supplyChain.getToken(1);
        
        assertEq(id, 1, "ID debe ser 1");
        assertEq(creator, producer, "Creator debe ser el producer");
        assertEq(keccak256(bytes(name)), keccak256(bytes("Gold")), "Name no coincide");
        assertEq(totalSupply, 10, "TotalSupply debe ser 10");

        // Token no existente
        vm.expectRevert("Token not found");
        supplyChain.getToken(999);
    }

    function testGetUserTokens() public {
        // 1. Producer crea Token 1
        vm.prank(producer);
        supplyChain.createToken("TokenA", 100, "", 0);

        // 2. Factory crea Token 2
        vm.prank(factory);
        supplyChain.createToken("TokenB", 50, "", 0);

        // 3. Transferencia de Producer a Factory (Token 1)
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50); // Solicita transferencia
        vm.prank(factory);
        supplyChain.acceptTransfer(1); // Acepta

        // Verificacion
        uint[] memory producerTokens = supplyChain.getUserTokens(producer);
        assertEq(producerTokens.length, 1, "Producer debe tener balance en 1 token (Token 1)");
        assertEq(producerTokens[0], 1, "Producer debe tener balance en Token 1");

        uint[] memory factoryTokens = supplyChain.getUserTokens(factory);
        assertEq(factoryTokens.length, 2, "Factory debe tener balance en 2 tokens (Token 1 y Token 2)");
        // El orden podria variar, pero ambos deben estar presentes
        assertTrue(factoryTokens[0] == 1 || factoryTokens[1] == 1, "Factory debe tener Token 1");
        assertTrue(factoryTokens[0] == 2 || factoryTokens[1] == 2, "Factory debe tener Token 2");
    }

    // --- Tests de transferencias ---

    function setupTokenAndTransfer() internal {
        // Producer crea Token 1
        vm.prank(producer);
        supplyChain.createToken("TokenP", 100, "", 0);

        // Producer transfiere 10 a Factory (Transfer 1)
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 10);
    }

    function testTransferFromProducerToFactory() public {
        vm.prank(producer);
        supplyChain.createToken("Goods", 10, "", 0);

        // Solicitud de transferencia
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 5);

        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.from, producer, "El origen no es Producer");
        assertEq(transfer.to, factory, "El destino no es Factory");
        assertEq(uint256(transfer.status), uint256(SupplyChain.TransferStatus.Pending), "El estado debe ser Pending");
    }

    function testTransferFromFactoryToRetailer() public {
        // 1. Producer crea y transfiere a Factory (prepara el token en Factory)
        setupTokenAndTransfer(); // Token 1, Transfer 1 (Pending)
        vm.prank(factory);
        supplyChain.acceptTransfer(1); // Factory ahora tiene 10 unidades de Token 1

        // 2. Factory solicita transferencia a Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 3); // Transfer 2

        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(2);
        assertEq(transfer.from, factory, "El origen no es Factory");
        assertEq(transfer.to, retailer, "El destino no es Retailer");
    }

    function testTransferFromRetailerToConsumer() public {
        // 1. Producer crea y transfiere a Factory
        setupTokenAndTransfer();
        vm.prank(factory);
        supplyChain.acceptTransfer(1); 
        
        // 2. Factory transfiere a Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 5); // Transfer 2
        vm.prank(retailer);
        supplyChain.acceptTransfer(2); // Retailer tiene 5 unidades de Token 1

        // 3. Retailer solicita transferencia a Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 1); // Transfer 3

        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(3);
        assertEq(transfer.from, retailer, "El origen no es Retailer");
        assertEq(transfer.to, consumer, "El destino no es Consumer");
    }

    function testAcceptTransfer() public {
        setupTokenAndTransfer(); // Token 1 (100 balance en Producer), Transfer 1 (10 a Factory, Pending)

        uint initialProducerBalance = supplyChain.getTokenBalance(1, producer);
        uint initialFactoryBalance = supplyChain.getTokenBalance(1, factory);

        // Aceptar transferencia (solo el receptor)
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(uint256(transfer.status), uint256(SupplyChain.TransferStatus.Accepted), "El estado debe ser Accepted");

        // Verificar balances
        assertEq(supplyChain.getTokenBalance(1, producer), initialProducerBalance - 10, "El balance del Producer debe disminuir");
        assertEq(supplyChain.getTokenBalance(1, factory), initialFactoryBalance + 10, "El balance del Factory debe aumentar");
    }

    function testRejectTransfer() public {
        setupTokenAndTransfer(); // Token 1 (100 balance en Producer), Transfer 1 (10 a Factory, Pending)
        uint initialProducerBalance = supplyChain.getTokenBalance(1, producer);

        // Rechazar transferencia (solo el receptor)
        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(uint256(transfer.status), uint256(SupplyChain.TransferStatus.Rejected), "El estado debe ser Rejected");

        // Verificar balances (deben permanecer sin cambios)
        assertEq(supplyChain.getTokenBalance(1, producer), initialProducerBalance, "El balance del Producer no debe cambiar tras rechazo");
        assertEq(supplyChain.getTokenBalance(1, factory), 0, "El balance del Factory no debe cambiar tras rechazo");
    }

    function testTransferInsufficientBalance() public {
        vm.prank(producer);
        supplyChain.createToken("SmallSupply", 5, "", 0); // Total supply de 5

        // Intento de `acceptTransfer` que causaria el revert por underflow
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 6); // Se solicita la transferencia (Transfer 1)

        vm.prank(factory);
        // Espera un revert por underflow al restar 6 de 5.
        // En Solidity 0.8.0, esto revertira automaticamente.
        vm.expectRevert(); 
        supplyChain.acceptTransfer(1); 
    }

    function testGetTransfer() public {
        setupTokenAndTransfer(); // Transfer 1

        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.id, 1, "ID de transferencia incorrecto");
        assertEq(transfer.from, producer, "Origen incorrecto");
        assertEq(transfer.to, factory, "Destino incorrecto");
        
        vm.expectRevert("Transfer not found");
        supplyChain.getTransfer(999);
    }

    function testGetUserTransfers() public {
        // 1. Transfer 1: Producer -> Factory (10)
        setupTokenAndTransfer(); 
        
        // 2. Transfer 2: Factory -> Retailer (5)
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 5); 

        // Verificacion de Producer (solo 1 transferencia como "from")
        uint[] memory producerTransfers = supplyChain.getUserTransfers(producer);
        assertEq(producerTransfers.length, 1, "Producer debe tener 1 transferencia");
        assertEq(producerTransfers[0], 1, "La transferencia de Producer debe ser la 1");

        // Verificacion de Factory (1 como "to" y 1 como "from")
        uint[] memory factoryTransfers = supplyChain.getUserTransfers(factory);
        assertEq(factoryTransfers.length, 2, "Factory debe tener 2 transferencias");
        // No se puede garantizar el orden, pero deben ser 1 y 2
        assertTrue(factoryTransfers[0] == 1 || factoryTransfers[1] == 1, "Factory debe tener Transfer 1");
        assertTrue(factoryTransfers[0] == 2 || factoryTransfers[1] == 2, "Factory debe tener Transfer 2");
    }

    // --- Tests de validaciones y permisos ---

    function testInvalidRoleTransfer() public {
        vm.prank(producer);
        supplyChain.createToken("Item", 100, "", 0);

        // 1. Producer a Retailer (Debe fallar)
        vm.prank(producer);
        vm.expectRevert("Producer can only transfer to Factory");
        supplyChain.transfer(retailer, 1, 10);

        // 2. Factory a Consumer (Debe fallar)
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 10); // Trans 1: P -> F
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        vm.prank(factory);
        vm.expectRevert("Factory can only transfer to Retailer");
        supplyChain.transfer(consumer, 1, 5);

        // 3. Retailer a Factory (Debe fallar - Transferencia inversa no permitida)
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 5); // Trans 2: F -> R
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        vm.prank(retailer);
        vm.expectRevert("Retailer can only transfer to Consumer");
        supplyChain.transfer(factory, 1, 1);
    }

    function testUnapprovedUserCannotCreateToken() public {
        string memory name = "ForbiddenItem";
        uint totalSupply = 10;
        string memory features = "{}";
        uint parentId = 0;

        // El unapprovedUser esta en Pending
        vm.prank(unapprovedUser);
        vm.expectRevert("User not approved");
        supplyChain.createToken(name, totalSupply, features, parentId);
    }

function testUnapprovedUserCannotTransfer() public {

    // -- El resto de la lógica de creación y transferencia del producer --
    vm.prank(producer);
    supplyChain.createToken("ItemForTransfer", 100, "", 0);

    // Transferir al unapprovedUser. Esto debe funcionar si está registrado.
    vm.prank(producer);
    supplyChain.transfer(factory, 1, 10); // Trans 1: P -> Unapproved
    
    // -- Prueba de que el unapprovedUser NO puede transferir --
    // El unapprovedUser esta registrado, pero NO APROBADO (Pending).
    vm.prank(unapprovedUser);
    vm.expectRevert("User not approved"); // Este es el error que esperas
    supplyChain.transfer(factory, 1, 1);
}

    function testOnlyAdminCanChangeStatus() public {
        // Intenta cambiar el estado como un usuario regular (Producer)
        vm.prank(producer);
        vm.expectRevert("Only admin can change user status");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Canceled);
    }

    function testConsumerCannotTransfer() public {
        // 1. Flujo completo a Consumer
        vm.prank(producer);
        supplyChain.createToken("ItemC", 10, "", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 10);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 10);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 10); // Trans 3: R -> C
        vm.prank(consumer);
        supplyChain.acceptTransfer(3); // Consumer tiene el token

        // 2. Consumer intenta transferir a cualquier rol (Debe fallar)
        vm.prank(consumer);
        vm.expectRevert("Invalid role for transfer");
        supplyChain.transfer(retailer, 1, 1);
        
        // Consumer intenta transferir al Factory
        vm.prank(consumer);
        vm.expectRevert("Invalid role for transfer");
        supplyChain.transfer(factory, 1, 1);

        // Consumer intenta transferir al Producer
        vm.prank(consumer);
        vm.expectRevert("Invalid role for transfer");
        supplyChain.transfer(producer, 1, 1);
    }

    function testTransferToSameAddress() public {
        vm.prank(producer);
        supplyChain.createToken("SelfTransfer", 10, "", 0);

        // El require de rol de origen/destino evitara la transferencia si los roles son iguales.
        // Producer a Producer: "Producer can only transfer to Factory"
        vm.prank(producer);
        vm.expectRevert("Producer can only transfer to Factory"); 
        supplyChain.transfer(producer, 1, 1);
    }

    // --- Tests de casos edge ---

    function testTransferZeroAmount() public {
        vm.prank(producer);
        supplyChain.createToken("ZeroTest", 10, "", 0);

        vm.prank(producer);
        vm.expectRevert("Amount must be greater than 0");
        supplyChain.transfer(factory, 1, 0);
    }

    function testTransferNonExistentToken() public {
        vm.prank(producer);
        vm.expectRevert("Token not found");
        supplyChain.transfer(factory, 999, 1);
    }

    function testAcceptNonExistentTransfer() public {
        vm.prank(factory);
        vm.expectRevert("Transfer not found");
        supplyChain.acceptTransfer(999);
    }

    function testDoubleAcceptTransfer() public {
        setupTokenAndTransfer(); // Transfer 1 (Pending)

        // 1. Aceptar
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // 2. Intentar aceptar de nuevo (debe fallar porque ya no esta en Pending)
        vm.prank(factory);
        vm.expectRevert("Transfer not pending");
        supplyChain.acceptTransfer(1);
    }

    function testTransferAfterRejection() public {
        setupTokenAndTransfer(); // Transfer 1 (Pending)

        // 1. Rechazar
        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        // 2. Intentar aceptar (debe fallar porque ya no esta en Pending)
        vm.prank(factory);
        vm.expectRevert("Transfer not pending");
        supplyChain.acceptTransfer(1);
    }

    // --- Tests de eventos ---

    function testUserRegisteredEvent() public {
        address newUser = address(0x808);
        
        vm.expectEmit(true, false, false, true); // true para indexado
        emit SupplyChain.UserRoleRequested(newUser, "Guest");
        
        vm.prank(newUser);
        supplyChain.requestUserRole("Guest", newUser);
    }

    function testUserStatusChangedEvent() public {
        vm.expectEmit(true, false, false, true);
        emit SupplyChain.UserStatusChanged(unapprovedUser, SupplyChain.UserStatus.Approved);
        
        vm.prank(admin);
        supplyChain.changeStatusUser(unapprovedUser, SupplyChain.UserStatus.Approved);
    }

    function testTokenCreatedEvent() public {
        string memory name = "EventToken";
        uint totalSupply = 10;

        vm.expectEmit(true, true, false, false);
        emit SupplyChain.TokenCreated(1, producer, name, totalSupply);

        vm.prank(producer);
        supplyChain.createToken(name, totalSupply, "", 0);
    }

    function testTransferInitiatedEvent() public {
        vm.prank(producer);
        supplyChain.createToken("EventItem", 10, "", 0);

        uint amount = 5;
        vm.expectEmit(true, true, false, false);
        emit SupplyChain.TransferRequested(1, producer, factory, 1, amount);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, amount);
    }

    function testTransferAcceptedEvent() public {
        setupTokenAndTransfer(); // Transfer 1 (Pending)

        vm.expectEmit(true, false, false, false);
        emit SupplyChain.TransferAccepted(1);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);
    }

    function testTransferRejectedEvent() public {
        setupTokenAndTransfer(); // Transfer 1 (Pending)

        vm.expectEmit(true, false, false, false);
        emit SupplyChain.TransferRejected(1);

        vm.prank(factory);
        supplyChain.rejectTransfer(1);
    }

    // --- Tests de flujo completo ---

function testCompleteSupplyChainFlow() public {
    // ⚠️ ELIMINAMOS las aserciones iniciales que causaban el "Token not found"
    // Ya que el Token ID 1 no existe hasta que se llama a createToken.

    // 1. Producer crea token (ID: 1, TotalSupply: 100)
    vm.prank(producer);
    supplyChain.createToken("RawMaterial", 100, '{"type":"wood"}', 0);
    
    // Verificación inicial de balance (después de la creación)
    // El balance inicial del Producer DEBE ser 100. Los demás deben ser 0.
    assertEq(supplyChain.getTokenBalance(1, producer), 100, "Producer initial balance");
    assertEq(supplyChain.getTokenBalance(1, factory), 0, "Initial Factory balance must be 0");
    assertEq(supplyChain.getTokenBalance(1, retailer), 0, "Initial Retailer balance must be 0");
    assertEq(supplyChain.getTokenBalance(1, consumer), 0, "Initial Consumer balance must be 0");
    
    // 2. Producer transfiere 50 a Factory (Trans ID: 1)
    vm.prank(producer);
    supplyChain.transfer(factory, 1, 50);
    vm.prank(factory);
    supplyChain.acceptTransfer(1);
    assertEq(supplyChain.getTokenBalance(1, producer), 50, "Producer balance after P->F");
    assertEq(supplyChain.getTokenBalance(1, factory), 50, "Factory balance after P->F");

    // 3. Factory transfiere 30 a Retailer (Trans ID: 2)
    vm.prank(factory);
    supplyChain.transfer(retailer, 1, 30);
    vm.prank(retailer);
    supplyChain.acceptTransfer(2);
    assertEq(supplyChain.getTokenBalance(1, factory), 20, "Factory balance after F->R");
    assertEq(supplyChain.getTokenBalance(1, retailer), 30, "Retailer balance after F->R");

    // 4. Retailer transfiere 10 a Consumer (Trans ID: 3)
    vm.prank(retailer);
    supplyChain.transfer(consumer, 1, 10);
    vm.prank(consumer);
    supplyChain.acceptTransfer(3);
    assertEq(supplyChain.getTokenBalance(1, retailer), 20, "Retailer balance after R->C");
    assertEq(supplyChain.getTokenBalance(1, consumer), 10, "Consumer balance after R->C");
}

    function testMultipleTokensFlow() public {
        // 1. Producer crea Token 1 (100)
        vm.prank(producer);
        supplyChain.createToken("TokenA", 100, "", 0);

        // 2. Factory crea Token 2 (50)
        vm.prank(factory);
        supplyChain.createToken("TokenB", 50, "", 0);

        // 3. P -> F (Token 1, 20)
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 20); // Trans 1
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // 4. F -> R (Token 2, 10)
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 10); // Trans 2
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // Verificacion de balances
        assertEq(supplyChain.getTokenBalance(1, producer), 80, "P Balance T1");
        assertEq(supplyChain.getTokenBalance(1, factory), 20, "F Balance T1");
        assertEq(supplyChain.getTokenBalance(2, factory), 40, "F Balance T2");
        assertEq(supplyChain.getTokenBalance(2, retailer), 10, "R Balance T2");

        // Verificacion de tokens por usuario
        uint[] memory producerTokens = supplyChain.getUserTokens(producer);
        assertEq(producerTokens.length, 1, "Producer debe tener 1 token");
        assertEq(producerTokens[0], 1, "Producer debe ser T1");

        uint[] memory retailerTokens = supplyChain.getUserTokens(retailer);
        assertEq(retailerTokens.length, 1, "Retailer debe tener 1 token");
        assertEq(retailerTokens[0], 2, "Retailer debe ser T2");
    }

    function testTraceabilityFlow() public {
        // 1. Producer crea Token 1 (Materia Prima)
        vm.prank(producer);
        supplyChain.createToken("Seed", 100, '{"stage":"planting"}', 0); // Token 1

        // 2. Producer transfiere 100 a Factory
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100); // Trans 1
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // 3. Factory crea Token 2 (Producto Intermedio, parentId: 1)
        vm.prank(factory);
        supplyChain.createToken("Oil", 50, '{"stage":"pressing"}', 1); // Token 2
        
        // 4. Factory transfiere 50 de Token 2 a Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 50); // Trans 2
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // 5. Retailer transfiere 5 de Token 2 a Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, 2, 5); // Trans 3
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);

        // **Verificacion de Trazabilidad**

        // Get info de Token 2
        (, , string memory nameT2, , , uint256 parentIdT2, ) = supplyChain.getToken(2);
        assertEq(keccak256(bytes(nameT2)), keccak256(bytes("Oil")), "T2 Name");
        assertEq(parentIdT2, 1, "T2 Parent ID");

        // Get info de Token 1 (el padre)
        (, , string memory nameT1, , , uint256 parentIdT1, ) = supplyChain.getToken(1);
        assertEq(keccak256(bytes(nameT1)), keccak256(bytes("Seed")), "T1 Name");
        assertEq(parentIdT1, 0, "T1 Parent ID");

        // Get Transferencias del Consumer (Token 2)
        uint[] memory consumerTransfers = supplyChain.getUserTransfers(consumer);
        assertEq(consumerTransfers.length, 1, "Consumer solo debe tener 1 transferencia");
        SupplyChain.Transfer memory finalTransfer = supplyChain.getTransfer(consumerTransfers[0]);
        assertEq(finalTransfer.tokenId, 2, "La transferencia final debe ser del Token 2");
    }
}