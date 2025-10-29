// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;


contract HolaMUndo{
    string private mensaje;
    constructor(){
        mensaje = "Hola Mundo";
    }
    function getMensaje() public view returns(string memory){
        return mensaje;
    }

    function actualizarMensaje(string memory _nuevoMensaje) public {
        mensaje = _nuevoMensaje;
    }
}

