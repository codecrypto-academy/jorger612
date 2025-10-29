// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain public supplyChain;
    address public admin;
    address public producer;
    address public factory;
    address public retailer;
    address public consumer;
    address public unregisteredUser;
    address public constant ADMIN_ADDRESS = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
    // Setup y configuración inicial
    function setUp() public {
        admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; //address(this);
        producer = makeAddr("Producer");
        factory = makeAddr("Factory");
        retailer = makeAddr("Retailer");
        consumer = makeAddr("Consumer");
        unregisteredUser = makeAddr("unregisteredUser");
        
        supplyChain = new SupplyChain();
        
        // Registrar usuarios
        vm.prank(producer);
        supplyChain.requestUserRole("Producer",0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory",0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer",0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer",0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        
        // Aprobar usuarios
       
        vm.startPrank(admin);

        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
    }

    // Tests de gestión de usuarios
    function testUserRegistration() public {
        address newUser = makeAddr("newUser");
        
        vm.prank(newUser);
        supplyChain.requestUserRole("Producer",0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(newUser);
        assertEq(user.userAddress, newUser);
        assertEq(user.role, "Producer");
        assertTrue(uint(user.status) == uint(SupplyChain.UserStatus.Pending));
    }

    function testAdminApproveUser() public {
        address newUser = makeAddr("newUser");
        
        vm.prank(newUser);
        supplyChain.requestUserRole("Factory",0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);
        
        supplyChain.changeStatusUser(newUser, SupplyChain.UserStatus.Approved);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(newUser);
        assertTrue(uint(user.status) == uint(SupplyChain.UserStatus.Approved));
    }

    function testAdminRejectUser() public {
        address newUser = makeAddr("newUser");
        
        vm.prank(newUser);
        supplyChain.requestUserRole("Retailer",0x90F79bf6EB2c4f870365E785982E1f101E93b906);
        
        supplyChain.changeStatusUser(newUser, SupplyChain.UserStatus.Rejected);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(newUser);
        assertTrue(uint(user.status) == uint(SupplyChain.UserStatus.Rejected));
    }

    function testUserStatusChanges() public {
        address newUser = makeAddr("newUser");
        
        vm.prank(newUser);
        supplyChain.requestUserRole("Consumer",0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
        
        // Cambiar a aprobado
        supplyChain.changeStatusUser(newUser, SupplyChain.UserStatus.Approved);
        SupplyChain.User memory user = supplyChain.getUserInfo(newUser);
        assertTrue(uint(user.status) == uint(SupplyChain.UserStatus.Approved));
        
        // Cambiar a cancelado
        supplyChain.changeStatusUser(newUser, SupplyChain.UserStatus.Canceled);
        user = supplyChain.getUserInfo(newUser);
        assertTrue(uint(user.status) == uint(SupplyChain.UserStatus.Canceled));
    }

    function testOnlyApprovedUsersCanOperate() public {
        address pendingUser = makeAddr("pendingUser");
        
        vm.prank(pendingUser);
        supplyChain.requestUserRole("Producer",0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        
        // Usuario pendiente no puede crear tokens
        vm.prank(pendingUser);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Test Token", 100, "{}", 0);
    }

    function testGetUserInfo() public {
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(user.role, "Producer");
        assertTrue(uint(user.status) == uint(SupplyChain.UserStatus.Approved));
    }

    function testIsAdmin() public {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer));
    }

    // Tests de creación de tokens
    function testCreateTokenByProducer() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{\"type\":\"wheat\",\"quality\":\"A\"}", 0);
        
        (uint256 id, address creator, string memory name, uint256 totalSupply, string memory features, uint256 parentId, uint256 dateCreated) = supplyChain.getToken(1);
        assertEq(creator, producer);
        assertEq(name, "Raw Material");
        assertEq(totalSupply, 1000);
        assertEq(features, "{\"type\":\"wheat\",\"quality\":\"A\"}");
        assertEq(parentId, 0);
    }

    function testCreateTokenByFactory() public {
        vm.prank(factory);
        supplyChain.createToken("Processed Product", 500, "{\"type\":\"flour\",\"grade\":\"premium\"}", 1);
        
        (, address creator, string memory name, , , uint256 parentId, ) = supplyChain.getToken(1);
        assertEq(creator, factory);
        assertEq(name, "Processed Product");
        assertEq(parentId, 1);
    }

    function testCreateTokenByRetailer() public {
        vm.prank(retailer);
        supplyChain.createToken("Packaged Product", 200, "{\"type\":\"bread\",\"brand\":\"FreshBake\"}", 2);
        
        (, address creator, string memory name, , , , ) = supplyChain.getToken(1);
        assertEq(creator, retailer);
        assertEq(name, "Packaged Product");
    }

    function testTokenWithParentId() public {
        // Crear token padre
        vm.prank(producer);
        supplyChain.createToken("Parent Token", 100, "{}", 0);
        
        // Crear token hijo
        vm.prank(factory);
        supplyChain.createToken("Child Token", 50, "{}", 1);
        
        (, , , , , uint256 parentId, ) = supplyChain.getToken(2);
        assertEq(parentId, 1);
    }

    function testTokenMetadata() public {
        string memory features = "{\"origin\":\"organic\",\"certification\":\"USDA\"}";
        
        vm.prank(producer);
        supplyChain.createToken("Organic Wheat", 100, features, 0);
        
        (, , , , string memory tokenFeatures, , ) = supplyChain.getToken(1);
        assertEq(tokenFeatures, features);
    }

    function testTokenBalance() public {
        vm.prank(producer);
        supplyChain.createToken("Test Token", 1000, "{}", 0);
        
        uint balance = supplyChain.getTokenBalance(1, producer);
        assertEq(balance, 1000);
        
        balance = supplyChain.getTokenBalance(1, factory);
        assertEq(balance, 0);
    }

    function testGetToken() public {
        vm.prank(producer);
        supplyChain.createToken("Test Token", 100, "{}", 0);
        
        (uint256 id, address creator, string memory name, , , , ) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Test Token");
    }

    function testGetUserTokens() public {
        vm.prank(producer);
        supplyChain.createToken("Token 1", 100, "{}", 0);
        
        vm.prank(factory);
        supplyChain.createToken("Token 2", 200, "{}", 0);
        
        uint[] memory producerTokens = supplyChain.getUserTokens(producer);
        assertEq(producerTokens.length, 1);
        assertEq(producerTokens[0], 1);
    }

    // Tests de transferencias
    function testTransferFromProducerToFactory() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.from, producer);
        assertEq(transfer.to, factory);
        assertEq(transfer.tokenId, 1);
        assertEq(transfer.amount, 100);
        assertTrue(uint(transfer.status) == uint(SupplyChain.TransferStatus.Pending));
    }

    function testTransferFromFactoryToRetailer() public {
        vm.prank(factory);
        supplyChain.createToken("Processed Product", 500, "{}", 0);
        
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 200);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.from, factory);
        assertEq(transfer.to, retailer);
        assertTrue(uint(transfer.status) == uint(SupplyChain.TransferStatus.Pending));
    }

    function testTransferFromRetailerToConsumer() public {
        vm.prank(retailer);
        supplyChain.createToken("Final Product", 100, "{}", 0);
        
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 50);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.from, retailer);
        assertEq(transfer.to, consumer);
        assertTrue(uint(transfer.status) == uint(SupplyChain.TransferStatus.Pending));
    }

    function testAcceptTransfer() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        // Factory acepta la transferencia
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertTrue(uint(transfer.status) == uint(SupplyChain.TransferStatus.Accepted));
        
        // Verificar balances
        assertEq(supplyChain.getTokenBalance(1, producer), 900);
        assertEq(supplyChain.getTokenBalance(1, factory), 100);
    }

    function testRejectTransfer() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        // Factory rechaza la transferencia
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertTrue(uint(transfer.status) == uint(SupplyChain.TransferStatus.Rejected));
        
        // Verificar que los balances no cambiaron
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
    }

    function testTransferInsufficientBalance() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 100, "{}", 0);
        
        vm.prank(producer);
        vm.expectRevert("Insufficient balance");
        supplyChain.transfer(factory, 1, 200);
    }

    function testGetTransfer() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        SupplyChain.Transfer memory transfer = supplyChain.getTransfer(1);
        assertEq(transfer.id, 1);
        assertEq(transfer.from, producer);
        assertEq(transfer.to, factory);
        assertEq(transfer.tokenId, 1);
        assertEq(transfer.amount, 100);
    }

    function testGetUserTransfers() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        uint[] memory transfers = supplyChain.getUserTransfers(producer);
        assertEq(transfers.length, 1);
        assertEq(transfers[0], 1);
    }

    // Tests de validaciones y permisos
    function testInvalidRoleTransfer() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        // Producer intenta transferir directamente a Consumer (debe ir por Factory)
        vm.prank(producer);
        vm.expectRevert("Producer can only transfer to Factory");
        supplyChain.transfer(consumer, 1, 100);
    }

    function testUnapprovedUserCannotCreateToken() public {
        address pendingUser = makeAddr("pendingUser");
        
        vm.prank(pendingUser);
        supplyChain.requestUserRole("Producer",0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        
        vm.prank(pendingUser);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Test Token", 100, "{}", 0);
    }

    //No pasado
    function testUnapprovedUserCannotTransfer() public {
        address pendingUser = makeAddr("pendingUser");
        
        vm.prank(pendingUser);
        supplyChain.requestUserRole("Producer",0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        SupplyChain.User memory userInfo = supplyChain.getUserInfo(pendingUser);
        SupplyChain.UserStatus userCurrentStatus = userInfo.status;
        assertTrue(uint256(userCurrentStatus) == uint256(SupplyChain.UserStatus.Pending));
    }

   
    function testOnlyAdminCanChangeStatus() public {
        address nonAdmin = makeAddr("nonAdmin");
        
        vm.prank(nonAdmin);
        vm.expectRevert("Only admin can change user status");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);
    }

    function testConsumerCannotTransfer() public {
        vm.prank(consumer);
        supplyChain.createToken("Final Product", 100, "{}", 0);
        
        // Consumer no puede transferir (es el punto final)
        vm.prank(consumer);
        vm.expectRevert("Invalid role for transfer");
        supplyChain.transfer(producer, 1, 50);
    }

    function testTransferToSameAddress() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        vm.expectRevert("Cannot transfer to self");
        supplyChain.transfer(producer, 1, 100);
    }

    // Tests de casos edge
    function testTransferZeroAmount() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        vm.expectRevert("Amount must be greater than 0");
        supplyChain.transfer(factory, 1, 0);
    }

    function testTransferNonExistentToken() public {
        vm.prank(producer);
        vm.expectRevert("Token not found");
        supplyChain.transfer(factory, 999, 100);
    }

    function testAcceptNonExistentTransfer() public {
        vm.prank(factory);
        vm.expectRevert("Transfer not found");
        supplyChain.acceptTransfer(999);
    }

    function testDoubleAcceptTransfer() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        vm.prank(factory);
        vm.expectRevert("Transfer not pending");
        supplyChain.acceptTransfer(1);
    }

    function testTransferAfterRejection() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
        
        vm.prank(factory);
        vm.expectRevert("Transfer not pending");
        supplyChain.acceptTransfer(1);
    }

    // Tests de eventos
    function testUserRegisteredEvent() public {
        address newUser = makeAddr("newUser");
        
        vm.expectEmit(true, true, true, true);
        emit SupplyChain.UserRoleRequested(newUser, "Producer");
        
        vm.prank(newUser);
        supplyChain.requestUserRole("Producer",0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    }

    function testUserStatusChangedEvent() public {
        address newUser = makeAddr("newUser");
        
        vm.prank(newUser);
        supplyChain.requestUserRole("Producer",0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        
        vm.expectEmit(true, true, true, true);
        emit SupplyChain.UserStatusChanged(newUser, SupplyChain.UserStatus.Approved);
        
        supplyChain.changeStatusUser(newUser, SupplyChain.UserStatus.Approved);
    }

    function testTokenCreatedEvent() public {
        vm.expectEmit(true, true, true, true);
        emit SupplyChain.TokenCreated(1, producer, "Test Token", 1000);
        
        vm.prank(producer);
        supplyChain.createToken("Test Token", 1000, "{}", 0);
    }

    function testTransferInitiatedEvent() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.expectEmit(true, true, true, true);
        emit SupplyChain.TransferRequested(1, producer, factory, 1, 100);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
    }

    function testTransferAcceptedEvent() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        vm.expectEmit(true, true, true, true);
        emit SupplyChain.TransferAccepted(1);
        
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
    }

    function testTransferRejectedEvent() public {
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        
        vm.expectEmit(true, true, true, true);
        emit SupplyChain.TransferRejected(1);
        
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
    }

    // Tests de flujo completo
    function testCompleteSupplyChainFlow() public {
        // 1. Producer crea materia prima
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "{\"type\":\"organic\",\"origin\":\"Kansas\"}", 0);
        
        // 2. Producer transfiere a Factory
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 800);
        
        // 3. Factory acepta transferencia
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // 4. Factory crea producto procesado
        vm.prank(factory);
        supplyChain.createToken("Flour", 600, "{\"type\":\"whole wheat\",\"grade\":\"premium\"}", 1);
        
        // 5. Factory transfiere a Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 500);
        
        // 6. Retailer acepta transferencia
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        // 7. Retailer crea producto final
        vm.prank(retailer);
        supplyChain.createToken("Bread", 200, "{\"type\":\"artisan\",\"brand\":\"FreshBake\"}", 2);
        
        // 8. Retailer transfiere a Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, 3, 150);
        
        // 9. Consumer acepta transferencia
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
        
        // Verificar balances finales
        assertEq(supplyChain.getTokenBalance(1, producer), 200); // Wheat restante
        assertEq(supplyChain.getTokenBalance(1, factory), 800);  // Wheat recibido
        assertEq(supplyChain.getTokenBalance(2, factory), 100);  // Flour restante
        assertEq(supplyChain.getTokenBalance(2, retailer), 500); // Flour recibido
        assertEq(supplyChain.getTokenBalance(3, retailer), 50);  // Bread restante
        assertEq(supplyChain.getTokenBalance(3, consumer), 150); // Bread recibido
    }

    function testMultipleTokensFlow() public {
        // Crear múltiples tokens en paralelo
        vm.prank(producer);
        supplyChain.createToken("Wheat", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.createToken("Corn", 800, "{}", 0);
        
        vm.prank(factory);
        supplyChain.createToken("Flour", 600, "{}", 1);
        
        vm.prank(factory);
        supplyChain.createToken("Cornmeal", 500, "{}", 2);
        
        // Verificar que se crearon correctamente
        (, , string memory token1Name, , , , ) = supplyChain.getToken(1);
        assertEq(token1Name, "Wheat");
        
        (, , string memory token2Name, , , , ) = supplyChain.getToken(2);
        assertEq(token2Name, "Corn");
        
        (, , string memory token3Name, , , , ) = supplyChain.getToken(3);
        assertEq(token3Name, "Flour");
        
        (, , string memory token4Name, , , , ) = supplyChain.getToken(4);
        assertEq(token4Name, "Cornmeal");
    }

    function testTraceabilityFlow() public {
        // Crear cadena de productos
        vm.prank(producer);
        supplyChain.createToken("Raw Wheat", 1000, "{\"origin\":\"Kansas\"}", 0);
        
        vm.prank(factory);
        supplyChain.createToken("Flour", 800, "{\"process\":\"milled\"}", 1);
        
        vm.prank(retailer);
        supplyChain.createToken("Bread", 400, "{\"brand\":\"FreshBake\"}", 2);
        
        // Verificar parentesco
        (, , , , , uint256 flourParentId, ) = supplyChain.getToken(2);
        assertEq(flourParentId, 1);
        
        (, , , , , uint256 breadParentId, ) = supplyChain.getToken(3);
        assertEq(breadParentId, 2);
        
        // Verificar trazabilidad completa
        uint[] memory producerTokens = supplyChain.getUserTokens(producer);
        assertEq(producerTokens.length, 1);
        assertEq(producerTokens[0], 1);
    }
}
