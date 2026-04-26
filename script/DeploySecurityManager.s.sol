// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SecurityManager} from "../src-eth/SecurityManager.sol";

/**
 * @title  DeploySecurityManager
 * @notice Despliega SecurityManager y muestra la dirección resultante.
 *
 * Uso local (Anvil):
 *   forge script script/DeploySecurityManager.s.sol \
 *     --rpc-url http://localhost:8545 \
 *     --broadcast \
 *     --private-key <PRIVATE_KEY>
 *
 * La dirección del contrato desplegado se guarda en deployments/latest.env
 */
contract DeploySecurityManager is Script {
    function run() external returns (SecurityManager sm) {
        vm.startBroadcast();
        sm = new SecurityManager();
        vm.stopBroadcast();

        console.log("SecurityManager desplegado en:", address(sm));
        console.log("Owner:", sm.owner());
    }
}
