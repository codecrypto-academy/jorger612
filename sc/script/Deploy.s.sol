// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import {Script} from "forge-std/Script.sol";
import {SupplyChain} from "../src/SupplyChain.sol";

contract DeployScript is Script {
    function run() public returns (SupplyChain) {
        vm.startBroadcast();

        SupplyChain supplyChain = new SupplyChain();

        vm.stopBroadcast();
        return supplyChain;
    }
}