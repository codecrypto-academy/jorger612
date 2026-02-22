// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title  SecurityManager
 * @notice Sistema RBAC: gestión de Roles, Usuarios y Menús.
 * @dev    Solo el owner del contrato puede crear, modificar e inhabilitar usuarios autorizados.
 */
contract SecurityManager is Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _rolCounter;
    Counters.Counter private _usuarioCounter;
    Counters.Counter private _menuCounter;

    struct CuentaAutorizada {
        address wallet;
        string nombre;
        uint256 fechaHora; // En Solidity usamos uint256 para timestamps
        bool activa;       // Para borrado lógico
    }

    struct Rol {
        uint32  id;
        string  nombre;
        bool    activo;
        uint256 timestamp;
        address ejecutor;
    }

    struct Usuario {
        uint32  id;
        string  login;
        string  nombre;
        uint32  rolId;
        bool    activo;
        uint256 timestamp;
        address ejecutor;
    }

    struct Menu {
        uint32  id;
        string  nombre;
        bool    activo;
        uint256 timestamp;
        address ejecutor;
    }

    struct MenuRol {
        uint32 menuId;
        uint32 rolId;
        bool   activo;
    }

    mapping(address => CuentaAutorizada) public cuentas;
    mapping(uint32 => Rol)     public roles;
    mapping(uint32 => Usuario) public usuarios;
    mapping(uint32 => Menu)    public menus;
    mapping(uint32 => uint32[]) public menusPorRol;
    mapping(uint32 => mapping(uint32 => MenuRol)) public menuRolAsociacion;

    error RolNoExiste(uint32 rolId);
    error RolInactivo(uint32 rolId);
    error UsuarioNoExiste(uint32 usuarioId);
    error MenuNoExiste(uint32 menuId);
    error MenuYaVinculado(uint32 rolId, uint32 menuId);
    error MenuNoVinculado(uint32 rolId, uint32 menuId);

    address[] public listaDirecciones;

    event CuentaCreada(address indexed wallet, string nombre, uint256 fechaHora);
    event CuentaActualizada(address indexed wallet, string nuevoNombre, uint256 fechaHora);
    event CuentaEliminada(address indexed wallet, uint256 fechaHora);
    
    event RolCreado(uint32 indexed id, string nombre, uint256 timestamp, address indexed ejecutor);
    event RolModificado(uint32 indexed id, string nombreAnterior, string nombreNuevo, uint256 timestamp, address indexed ejecutor);
    event RolInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);

    event UsuarioCreado(uint32 indexed id, string login, string nombre, uint32 indexed rolId, uint256 timestamp, address indexed ejecutor);
    event UsuarioModificado(uint32 indexed id, string login, string nombre, uint32 rolIdAnterior, uint32 rolIdNuevo, uint256 timestamp, address indexed ejecutor);
    event UsuarioInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);

    event MenuCreado(uint32 indexed id, string nombre, uint256 timestamp, address indexed ejecutor);
    event MenuModificado(uint32 indexed id, string nombreAnterior, string nombreNuevo, uint256 timestamp, address indexed ejecutor);
    event MenuInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);

    event MenuVinculadoARol(uint32 indexed rolId, uint32 indexed menuId, uint256 timestamp, address indexed ejecutor);
    event MenuDesvinculadoDeRol(uint32 indexed rolId, uint32 indexed menuId, uint256 timestamp, address indexed ejecutor);

    constructor() {}

// Nueva seccion cuentas CuentaAutorizada

// CREATE: Agregar nueva cuenta autorizada
    function crearCuenta(address _wallet, string calldata _nombre) external onlyOwner {
        require(_wallet != address(0), "Direccion invalida");
        require(cuentas[_wallet].wallet == address(0), "La cuenta ya existe");

        cuentas[_wallet] = CuentaAutorizada({
            wallet: _wallet,
            nombre: _nombre,
            fechaHora: block.timestamp,
            activa: true
        });

        listaDirecciones.push(_wallet);

        emit CuentaCreada(_wallet, _nombre, block.timestamp);
    }

    // READ: Obtener datos de una cuenta (Solidity ya genera un getter automático para el mapping, 
    // pero esta función es más explícita)
    function obtenerCuenta(address _wallet) external view returns (CuentaAutorizada memory) {
        require(cuentas[_wallet].wallet != address(0), "La cuenta no existe");
        return cuentas[_wallet];
    }

    // UPDATE: Modificar nombre de cuenta existente
    function actualizarCuenta(address _wallet, string calldata _nuevoNombre) external onlyOwner {
        require(cuentas[_wallet].wallet != address(0), "La cuenta no existe");
        
        cuentas[_wallet].nombre = _nuevoNombre;
        cuentas[_wallet].fechaHora = block.timestamp; // Actualizamos el último movimiento

        emit CuentaActualizada(_wallet, _nuevoNombre, block.timestamp);
    }

    // DELETE: Eliminar cuenta (Borrado físico del mapping)
    function eliminarCuenta(address _wallet) external onlyOwner {
        require(cuentas[_wallet].wallet != address(0), "La cuenta no existe");

        delete cuentas[_wallet];
        
        // Nota: El address permanecerá en listaDirecciones pero al consultar el mapping 
        // devolverá valores vacíos. Para una app real, podrías filtrar en el frontend.

        emit CuentaEliminada(_wallet, block.timestamp);
    }

// Fin de cuentas autorizadas


    function crearRol(string calldata nombre) external returns (uint32 nuevoId) {
        _rolCounter.increment();
        nuevoId = uint32(_rolCounter.current());

        roles[nuevoId] = Rol({
            id: nuevoId,
            nombre: nombre,
            activo: true,
            timestamp: block.timestamp,
            ejecutor: msg.sender
        });

        emit RolCreado(nuevoId, nombre, block.timestamp, msg.sender);
    }

    function modificarRol(uint32 id, string calldata nombre) external {
        if (roles[id].id == 0) revert RolNoExiste(id);

        string memory nombreAnterior = roles[id].nombre;
        roles[id].nombre = nombre;
        roles[id].timestamp = block.timestamp;
        roles[id].ejecutor = msg.sender;

        emit RolModificado(id, nombreAnterior, nombre, block.timestamp, msg.sender);
    }

    function inhabilitarRol(uint32 id) external {
        if (roles[id].id == 0) revert RolNoExiste(id);

        roles[id].activo = false;
        roles[id].timestamp = block.timestamp;
        roles[id].ejecutor = msg.sender;

        emit RolInhabilitado(id, block.timestamp, msg.sender);
    }

    function crearUsuario(string calldata login, string calldata nombre, uint32 rolId)
        external
        returns (uint32 nuevoId)
    {
        if (roles[rolId].id == 0) revert RolNoExiste(rolId);
        if (!roles[rolId].activo) revert RolInactivo(rolId);

        _usuarioCounter.increment();
        nuevoId = uint32(_usuarioCounter.current());

        usuarios[nuevoId] = Usuario({
            id: nuevoId,
            login: login,
            nombre: nombre,
            rolId: rolId,
            activo: true,
            timestamp: block.timestamp,
            ejecutor: msg.sender
        });

        emit UsuarioCreado(nuevoId, login, nombre, rolId, block.timestamp, msg.sender);
    }

    function modificarUsuario(uint32 id, string calldata login, string calldata nombre, uint32 rolId) external {
        if (usuarios[id].id == 0) revert UsuarioNoExiste(id);
        if (roles[rolId].id == 0) revert RolNoExiste(rolId);
        if (!roles[rolId].activo) revert RolInactivo(rolId);

        uint32 rolIdAnterior = usuarios[id].rolId;
        usuarios[id].login = login;
        usuarios[id].nombre = nombre;
        usuarios[id].rolId = rolId;
        usuarios[id].timestamp = block.timestamp;
        usuarios[id].ejecutor = msg.sender;

        emit UsuarioModificado(id, login, nombre, rolIdAnterior, rolId, block.timestamp, msg.sender);
    }

    function inhabilitarUsuario(uint32 id) external {
        if (usuarios[id].id == 0) revert UsuarioNoExiste(id);

        usuarios[id].activo = false;
        usuarios[id].timestamp = block.timestamp;
        usuarios[id].ejecutor = msg.sender;

        emit UsuarioInhabilitado(id, block.timestamp, msg.sender);
    }

    function crearMenu(string calldata nombre) external returns (uint32 nuevoId) {
        _menuCounter.increment();
        nuevoId = uint32(_menuCounter.current());

        menus[nuevoId] = Menu({
            id: nuevoId,
            nombre: nombre,
            activo: true,
            timestamp: block.timestamp,
            ejecutor: msg.sender
        });

        emit MenuCreado(nuevoId, nombre, block.timestamp, msg.sender);
    }

    function modificarMenu(uint32 id, string calldata nombre) external {
        if (menus[id].id == 0) revert MenuNoExiste(id);

        string memory nombreAnterior = menus[id].nombre;
        menus[id].nombre = nombre;
        menus[id].timestamp = block.timestamp;
        menus[id].ejecutor = msg.sender;

        emit MenuModificado(id, nombreAnterior, nombre, block.timestamp, msg.sender);
    }

    function inhabilitarMenu(uint32 id) external {
        if (menus[id].id == 0) revert MenuNoExiste(id);

        menus[id].activo = false;
        menus[id].timestamp = block.timestamp;
        menus[id].ejecutor = msg.sender;

        emit MenuInhabilitado(id, block.timestamp, msg.sender);
    }

    function vincularMenuARol(uint32 rolId, uint32 menuId) external {
        if (roles[rolId].id == 0) revert RolNoExiste(rolId);
        if (menus[menuId].id == 0) revert MenuNoExiste(menuId);
        if (menuRolAsociacion[rolId][menuId].activo) revert MenuYaVinculado(rolId, menuId);

        menuRolAsociacion[rolId][menuId] = MenuRol({
            menuId: menuId,
            rolId: rolId,
            activo: true
        });
        menusPorRol[rolId].push(menuId);

        emit MenuVinculadoARol(rolId, menuId, block.timestamp, msg.sender);
    }

    function desvincularMenuDeRol(uint32 rolId, uint32 menuId) external {
        if (roles[rolId].id == 0) revert RolNoExiste(rolId);
        if (menus[menuId].id == 0) revert MenuNoExiste(menuId);
        if (!menuRolAsociacion[rolId][menuId].activo) revert MenuNoVinculado(rolId, menuId);

        menuRolAsociacion[rolId][menuId].activo = false;

        emit MenuDesvinculadoDeRol(rolId, menuId, block.timestamp, msg.sender);
    }

    function obtenerMenusPorRol(uint32 rolId) external view returns (uint32[] memory) {
        return menusPorRol[rolId];
    }

    function verificarAcceso(uint32 rolId, uint32 menuId) external view returns (bool) {
        return menuRolAsociacion[rolId][menuId].activo;
    }
}
