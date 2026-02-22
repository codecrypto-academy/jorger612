// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src-eth/SecurityManager.sol";

contract SecurityManagerTest is Test {
    SecurityManager public sm;
    address public owner = address(this);
    address public attacker = makeAddr("attacker");

    event RolCreado(uint32 indexed id, string nombre, uint256 timestamp, address indexed ejecutor);
    event RolModificado(
        uint32 indexed id, string nombreAnterior, string nombreNuevo, uint256 timestamp, address indexed ejecutor
    );
    event RolInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);
    event UsuarioCreado(
        uint32 indexed id,
        string login,
        string nombre,
        uint32 indexed rolId,
        uint256 timestamp,
        address indexed ejecutor
    );
    event UsuarioModificado(
        uint32 indexed id,
        string login,
        string nombre,
        uint32 rolIdAnterior,
        uint32 rolIdNuevo,
        uint256 timestamp,
        address indexed ejecutor
    );
    event UsuarioInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);
    event CuentaCreada(address indexed wallet, string nombre, uint256 fechaHora);
    event CuentaActualizada(address indexed wallet, string nuevoNombre, uint256 fechaHora);
    event CuentaEliminada(address indexed wallet, uint256 fechaHora);

    event MenuCreado(uint32 indexed id, string nombre, uint256 timestamp, address indexed ejecutor);
    event MenuModificado(
        uint32 indexed id, string nombreAnterior, string nombreNuevo, uint256 timestamp, address indexed ejecutor
    );
    event MenuInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);
    event MenuVinculadoARol(uint32 indexed rolId, uint32 indexed menuId, uint256 timestamp, address indexed ejecutor);
    event MenuDesvinculadoDeRol(
        uint32 indexed rolId, uint32 indexed menuId, uint256 timestamp, address indexed ejecutor
    );

    function setUp() public {
        sm = new SecurityManager();
    }

    function test_CrearRol_EmiteEventoConEjecutorCorrecto() public {
        vm.expectEmit(true, true, false, true);
        emit RolCreado(1, "Admin", block.timestamp, owner);
        sm.crearRol("Admin");
    }

    function test_CrearRol_AlmacenaEstadoCorrecto() public {
        uint32 id = sm.crearRol("Supervisor");
        (uint32 rId, string memory rNombre, bool rActivo,, address rEjecutor) = sm.roles(id);
        assertEq(rId, id);
        assertEq(rNombre, "Supervisor");
        assertTrue(rActivo);
        assertEq(rEjecutor, owner);
    }

    function test_InhabilitarRol_CambiaEstadoActivo() public {
        uint32 id = sm.crearRol("Auditor");
        (,, bool activoAntes,,) = sm.roles(id);
        assertTrue(activoAntes);
        sm.inhabilitarRol(id);
        (,, bool activoDespues,,) = sm.roles(id);
        assertFalse(activoDespues);
    }

    function test_InhabilitarRol_EmiteEventoConEjecutorCorrecto() public {
        uint32 id = sm.crearRol("Temporal");
        vm.expectEmit(true, true, false, true);
        emit RolInhabilitado(id, block.timestamp, owner);
        sm.inhabilitarRol(id);
    }

    function test_InhabilitarRol_Inexistente_Revierte() public {
        vm.expectRevert(abi.encodeWithSelector(SecurityManager.RolNoExiste.selector, uint32(999)));
        sm.inhabilitarRol(999);
    }

    function test_ModificarRol_EmiteEventoConNombres() public {
        uint32 id = sm.crearRol("Viejo");
        vm.expectEmit(true, true, false, true);
        emit RolModificado(id, "Viejo", "Nuevo", block.timestamp, owner);
        sm.modificarRol(id, "Nuevo");
    }

    function test_CrearUsuario_RolInexistente_Revierte() public {
        vm.expectRevert(abi.encodeWithSelector(SecurityManager.RolNoExiste.selector, uint32(99)));
        sm.crearUsuario("jdoe", "John Doe", 99);
    }

    function test_CrearUsuario_RolInactivo_Revierte() public {
        uint32 rolId = sm.crearRol("RolAInhabilitar");
        sm.inhabilitarRol(rolId);
        vm.expectRevert(abi.encodeWithSelector(SecurityManager.RolInactivo.selector, rolId));
        sm.crearUsuario("jdoe", "John Doe", rolId);
    }

    function test_CrearUsuario_EmiteEventoConEjecutorCorrecto() public {
        uint32 rolId = sm.crearRol("Admin");
        vm.expectEmit(true, true, false, true);
        emit UsuarioCreado(1, "jdoe", "John Doe", rolId, block.timestamp, owner);
        sm.crearUsuario("jdoe", "John Doe", rolId);
    }

    function test_InhabilitarUsuario_CambiaEstadoActivo() public {
        uint32 rolId = sm.crearRol("Admin");
        uint32 usuarioId = sm.crearUsuario("jane", "Jane Doe", rolId);
        (,,,, bool activoAntes,,) = sm.usuarios(usuarioId);
        assertTrue(activoAntes);
        sm.inhabilitarUsuario(usuarioId);
        (,,,, bool activoDespues,,) = sm.usuarios(usuarioId);
        assertFalse(activoDespues);
    }

    function test_InhabilitarUsuario_EmiteEventoConEjecutorCorrecto() public {
        uint32 rolId = sm.crearRol("Admin");
        uint32 usuarioId = sm.crearUsuario("bob", "Bob", rolId);
        vm.expectEmit(true, true, false, true);
        emit UsuarioInhabilitado(usuarioId, block.timestamp, owner);
        sm.inhabilitarUsuario(usuarioId);
    }

    function test_ModificarUsuario_RolInexistente_Revierte() public {
        uint32 rolId = sm.crearRol("Admin");
        uint32 usuarioId = sm.crearUsuario("alice", "Alice", rolId);
        vm.expectRevert(abi.encodeWithSelector(SecurityManager.RolNoExiste.selector, uint32(999)));
        sm.modificarUsuario(usuarioId, "alice", "Alice", 999);
    }

    function test_CrearMenu_EmiteEventoConEjecutorCorrecto() public {
        vm.expectEmit(true, true, false, true);
        emit MenuCreado(1, "Dashboard", block.timestamp, owner);
        sm.crearMenu("Dashboard");
    }

    function test_InhabilitarMenu_CambiaEstadoActivo() public {
        uint32 menuId = sm.crearMenu("Reportes");
        (,, bool activoAntes,,) = sm.menus(menuId);
        assertTrue(activoAntes);
        sm.inhabilitarMenu(menuId);
        (,, bool activoDespues,,) = sm.menus(menuId);
        assertFalse(activoDespues);
    }

    function test_VincularMenuARol_EmiteEventoCorrecto() public {
        uint32 rolId = sm.crearRol("Admin");
        uint32 menuId = sm.crearMenu("Dashboard");
        vm.expectEmit(true, true, false, true);
        emit MenuVinculadoARol(rolId, menuId, block.timestamp, owner);
        sm.vincularMenuARol(rolId, menuId);
    }

    function test_VincularMenuARol_Doble_Revierte() public {
        uint32 rolId = sm.crearRol("Admin");
        uint32 menuId = sm.crearMenu("Config");
        sm.vincularMenuARol(rolId, menuId);
        vm.expectRevert(abi.encodeWithSelector(SecurityManager.MenuYaVinculado.selector, rolId, menuId));
        sm.vincularMenuARol(rolId, menuId);
    }

    function test_DesvincularMenuDeRol_DesactivaAcceso() public {
        uint32 rolId = sm.crearRol("Admin");
        uint32 menuId = sm.crearMenu("Usuarios");
        sm.vincularMenuARol(rolId, menuId);
        assertTrue(sm.verificarAcceso(rolId, menuId));
        sm.desvincularMenuDeRol(rolId, menuId);
        assertFalse(sm.verificarAcceso(rolId, menuId));
    }

    function test_ObtenerMenusPorRol_RetornaMenusVinculados() public {
        uint32 rolId = sm.crearRol("Admin");
        uint32 menuId1 = sm.crearMenu("MenuA");
        uint32 menuId2 = sm.crearMenu("MenuB");
        sm.vincularMenuARol(rolId, menuId1);
        sm.vincularMenuARol(rolId, menuId2);
        uint32[] memory menusArr = sm.obtenerMenusPorRol(rolId);
        assertEq(menusArr.length, 2);
        assertEq(menusArr[0], menuId1);
        assertEq(menusArr[1], menuId2);
    }

    // === Tests CuentaAutorizada ===

    function test_CrearCuenta_Owner_CreaCorrectamente() public {
        vm.expectEmit(true, true, false, true);
        emit CuentaCreada(attacker, "Atacante", block.timestamp);
        sm.crearCuenta(attacker, "Atacante");

        SecurityManager.CuentaAutorizada memory c = sm.obtenerCuenta(attacker);
        assertEq(c.wallet, attacker);
        assertEq(c.nombre, "Atacante");
        assertTrue(c.activa);
    }

    function test_CrearCuenta_DireccionInvalida_Revierte() public {
        vm.expectRevert("Direccion invalida");
        sm.crearCuenta(address(0), "Zero");
    }

    function test_CrearCuenta_CuentaYaExiste_Revierte() public {
        sm.crearCuenta(attacker, "Primera");
        vm.expectRevert("La cuenta ya existe");
        sm.crearCuenta(attacker, "Segunda");
    }

    function test_ObtenerCuenta_RetornaDatosCorrectos() public {
        sm.crearCuenta(attacker, "Test User");
        SecurityManager.CuentaAutorizada memory c = sm.obtenerCuenta(attacker);
        assertEq(c.wallet, attacker);
        assertEq(c.nombre, "Test User");
        assertEq(c.fechaHora, block.timestamp);
        assertTrue(c.activa);
    }

    function test_ObtenerCuenta_NoExiste_Revierte() public {
        vm.expectRevert("La cuenta no existe");
        sm.obtenerCuenta(attacker);
    }

    function test_ActualizarCuenta_Owner_ActualizaNombre() public {
        sm.crearCuenta(attacker, "Original");
        vm.expectEmit(true, true, false, true);
        emit CuentaActualizada(attacker, "Actualizado", block.timestamp);
        sm.actualizarCuenta(attacker, "Actualizado");

        SecurityManager.CuentaAutorizada memory c = sm.obtenerCuenta(attacker);
        assertEq(c.nombre, "Actualizado");
    }

    function test_ActualizarCuenta_NoOwner_Revierte() public {
        sm.crearCuenta(attacker, "Original");
        address other = makeAddr("other");
        vm.prank(other);
        vm.expectRevert("Ownable: caller is not the owner");
        sm.actualizarCuenta(attacker, "Hacked");
    }

    function test_EliminarCuenta_Owner_Elimina() public {
        sm.crearCuenta(attacker, "ToDelete");
        vm.expectEmit(true, true, false, true);
        emit CuentaEliminada(attacker, block.timestamp);
        sm.eliminarCuenta(attacker);

        vm.expectRevert("La cuenta no existe");
        sm.obtenerCuenta(attacker);
    }

    function test_EliminarCuenta_NoOwner_Revierte() public {
        sm.crearCuenta(attacker, "ToDelete");
        vm.prank(attacker);
        vm.expectRevert("Ownable: caller is not the owner");
        sm.eliminarCuenta(attacker);
    }

    function test_ListaDirecciones_ContieneCuentasCreadas() public {
        address addr1 = makeAddr("addr1");
        address addr2 = makeAddr("addr2");
        sm.crearCuenta(addr1, "Uno");
        sm.crearCuenta(addr2, "Dos");

        assertEq(sm.listaDirecciones(0), addr1);
        assertEq(sm.listaDirecciones(1), addr2);
    }

    function test_OnlyOwner_CrearCuenta_NoOwner_Revierte() public {
        vm.prank(attacker);
        vm.expectRevert("Ownable: caller is not the owner");
        sm.crearCuenta(attacker, "Hacker");
    }

    function test_IdsAutoincrementales_Roles() public {
        uint32 id1 = sm.crearRol("RolUno");
        uint32 id2 = sm.crearRol("RolDos");
        uint32 id3 = sm.crearRol("RolTres");
        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
    }
}
