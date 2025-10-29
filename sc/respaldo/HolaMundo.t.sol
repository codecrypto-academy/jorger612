// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {stdError, Test, console} from "forge-std/Test.sol";
import {HolaMUndo} from "../src/HolaMundo.sol";

contract HolaMundoTest is Test {
    HolaMUndo public holaMundo;

    function setUp() public {
        holaMundo = new HolaMUndo();
    }

    function test_GetMensaje() public view {
        string memory mensaje = holaMundo.getMensaje();
        assertEq(mensaje, "Hola Mundo");
    }

    function test_ActualizarMensaje() public {
        holaMundo.actualizarMensaje("Hola Ethereum");
        string memory mensaje = holaMundo.getMensaje();
        assertEq(mensaje, "Hola Ethereum");
    }
}