// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src-eth/SecurityManager.sol";

/**
 * @title  SecurityManagerScript
 * @notice Script de despliegue de SecurityManager para uso con Anvil (red local).
 * @dev    Ejecutar con: forge script anvil/SecurityManager.s.sol:SecurityManagerScript
 *         --rpc-url http://localhost:8545 --private-key <PRIVATE_KEY> --broadcast
 *
 *         Con Anvil por defecto, usar la primera cuenta de prueba:
 *         --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 */
contract SecurityManagerScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));

        vm.startBroadcast(deployerPrivateKey);

        SecurityManager securityManager = new SecurityManager();

        vm.stopBroadcast();

        console.log("SecurityManager desplegado en:", address(securityManager));
        console.log("Owner (deployer):", securityManager.owner());
    }
}
