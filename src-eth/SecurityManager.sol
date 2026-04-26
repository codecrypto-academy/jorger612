// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  SecurityManager
 * @notice Sistema RBAC: gestión de Roles, Usuarios y Menús.
 * @dev    Solo el owner puede crear, modificar e inhabilitar entidades.
 *         Optimizado para lecturas batch: una sola llamada RPC carga el estado completo.
 */
contract SecurityManager is Ownable {

    // ─── Contadores ────────────────────────────────────────────────────────────
    // uint32 plano reemplaza Counters.Counter (deprecated en OZ 4.9, eliminado en v5).
    // Ahorra un SLOAD por operación de escritura al no necesitar leer un struct wrapper.
    uint32 private _rolCounter;
    uint32 private _usuarioCounter;
    uint32 private _menuCounter;

    // ─── Structs (campos reordenados para máximo packing de storage) ───────────
    //
    // Regla: agrupar tipos pequeños contiguos para que quepan en el mismo slot de 32 B.
    //
    // CuentaAutorizada: address(20) + bool(1) + uint64(8) = 29 B → slot 0 | string → slot 1
    // Antes: 4 slots  →  Ahora: 2 slots  (−2 SLOADs por lectura)
    struct CuentaAutorizada {
        address wallet;   // 20 B ┐
        bool    activa;   //  1 B ├─ slot 0  (29/32 B usados)
        uint64  fechaHora;//  8 B ┘
        string  nombre;   // slot 1 (referencia dinámica)
    }

    // Rol: uint32(4) + bool(1) + address(20) = 25 B → slot 0 | uint64(8) → slot 1 | string → slot 2
    // Antes: 5 slots  →  Ahora: 3 slots  (−2 SLOADs por lectura)
    struct Rol {
        uint32  id;       //  4 B ┐
        bool    activo;   //  1 B ├─ slot 0  (25/32 B usados)
        address ejecutor; // 20 B ┘
        uint64  timestamp;//  8 B  → slot 1
        string  nombre;   // slot 2 (referencia dinámica)
    }

    // Usuario: uint32(4)+uint32(4)+bool(1)+address(20) = 29 B → slot 0 | uint64(8) → slot 1 | string×2 → slots 2-3
    // Antes: 6 slots  →  Ahora: 4 slots  (−2 SLOADs por lectura)
    struct Usuario {
        uint32  id;       //  4 B ┐
        uint32  rolId;    //  4 B │
        bool    activo;   //  1 B ├─ slot 0  (29/32 B usados)
        address ejecutor; // 20 B ┘
        uint64  timestamp;//  8 B  → slot 1
        string  login;    // slot 2 (referencia dinámica)
        string  nombre;   // slot 3 (referencia dinámica)
    }

    // Menu: uint32(4) + bool(1) + address(20) = 25 B → slot 0 | uint64(8) → slot 1 | string → slot 2
    // Antes: 5 slots  →  Ahora: 3 slots  (−2 SLOADs por lectura)
    struct Menu {
        uint32  id;       //  4 B ┐
        bool    activo;   //  1 B ├─ slot 0  (25/32 B usados)
        address ejecutor; // 20 B ┘
        uint64  timestamp;//  8 B  → slot 1
        string  nombre;   // slot 2 (referencia dinámica)
    }

    // MenuRol: uint32(4)+uint32(4)+bool(1) = 9 B → slot 0  (sin cambios)
    struct MenuRol {
        uint32 menuId;    //  4 B ┐
        uint32 rolId;     //  4 B ├─ slot 0  (9/32 B usados)
        bool   activo;    //  1 B ┘
    }

    // ─── Storage principal ─────────────────────────────────────────────────────
    mapping(address => CuentaAutorizada)              public cuentas;
    mapping(uint32  => Rol)                           public roles;
    mapping(uint32  => Usuario)                       public usuarios;
    mapping(uint32  => Menu)                          public menus;
    mapping(uint32  => uint32[])                      public menusPorRol;
    mapping(uint32  => mapping(uint32 => MenuRol))    public menuRolAsociacion;

    // Arrays de IDs para consultas batch — permiten cargar todo el estado en una llamada RPC
    address[] public listaDirecciones;
    uint32[]  private _idsRoles;
    uint32[]  private _idsUsuarios;
    uint32[]  private _idsMenus;

    // Previene que el mismo menuId se agregue dos veces a menusPorRol[rolId]
    // cuando un menú es desvinculado y luego re-vinculado al mismo rol.
    mapping(uint32 => mapping(uint32 => bool)) private _menuEnArrayRol;

    // ─── Custom Errors ─────────────────────────────────────────────────────────
    error DireccionInvalida();
    error CuentaYaExiste(address wallet);
    error CuentaNoExiste(address wallet);
    error RolNoExiste(uint32 rolId);
    error RolInactivo(uint32 rolId);
    error UsuarioNoExiste(uint32 usuarioId);
    error MenuNoExiste(uint32 menuId);
    error MenuYaVinculado(uint32 rolId, uint32 menuId);
    error MenuNoVinculado(uint32 rolId, uint32 menuId);

    // ─── Events ────────────────────────────────────────────────────────────────
    event CuentaCreada(address indexed wallet, string nombre, uint256 fechaHora);
    event CuentaActualizada(address indexed wallet, string nuevoNombre, uint256 fechaHora);
    event CuentaEliminada(address indexed wallet, uint256 fechaHora);

    event RolCreado(uint32 indexed id, string nombre, uint256 timestamp, address indexed ejecutor);
    event RolModificado(
        uint32 indexed id, string nombreAnterior, string nombreNuevo, uint256 timestamp, address indexed ejecutor
    );
    event RolInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);

    event UsuarioCreado(
        uint32 indexed id, string login, string nombre,
        uint32 indexed rolId, uint256 timestamp, address indexed ejecutor
    );
    event UsuarioModificado(
        uint32 indexed id, string login, string nombre,
        uint32 rolIdAnterior, uint32 rolIdNuevo, uint256 timestamp, address indexed ejecutor
    );
    event UsuarioInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);

    event MenuCreado(uint32 indexed id, string nombre, uint256 timestamp, address indexed ejecutor);
    event MenuModificado(
        uint32 indexed id, string nombreAnterior, string nombreNuevo, uint256 timestamp, address indexed ejecutor
    );
    event MenuInhabilitado(uint32 indexed id, uint256 timestamp, address indexed ejecutor);

    event MenuVinculadoARol(uint32 indexed rolId, uint32 indexed menuId, uint256 timestamp, address indexed ejecutor);
    event MenuDesvinculadoDeRol(
        uint32 indexed rolId, uint32 indexed menuId, uint256 timestamp, address indexed ejecutor
    );

    // ─── Custom Modifiers ──────────────────────────────────────────────────────

    /// @dev Permite al owner Y a cualquier cuenta activa en el mapping `cuentas`.
    ///      Owner gestiona el whitelist; las cuentas autorizadas administran RBAC.
    error NoAutorizado(address caller);

    modifier onlyCuentaAutorizada() {
        _checkCuentaAutorizada();
        _;
    }

    /// @dev Lógica extraída del modifier para reducir tamaño de bytecode
    ///      (evita que el body se inline en cada uno de los 10 sitios de uso).
    function _checkCuentaAutorizada() internal view {
        if (msg.sender != owner()) {
            CuentaAutorizada storage c = cuentas[msg.sender];
            if (c.wallet == address(0) || !c.activa) revert NoAutorizado(msg.sender);
        }
    }

    constructor() {}

    // ═══════════════════════════════════════════════════════════════════════════
    // CUENTAS AUTORIZADAS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Registra una nueva cuenta autorizada.
    /// @param _wallet   Dirección de la wallet a autorizar.
    /// @param _nombre   Nombre descriptivo de la cuenta.
    function crearCuenta(address _wallet, string calldata _nombre) external onlyOwner {
        if (_wallet == address(0)) revert DireccionInvalida();
        if (cuentas[_wallet].wallet != address(0)) revert CuentaYaExiste(_wallet);

        cuentas[_wallet] = CuentaAutorizada({
            wallet:   _wallet,
            activa:   true,
            fechaHora: uint64(block.timestamp),
            nombre:   _nombre
        });
        listaDirecciones.push(_wallet);

        emit CuentaCreada(_wallet, _nombre, block.timestamp);
    }

    /// @notice Devuelve los datos de una cuenta autorizada.
    /// @param _wallet Dirección a consultar.
    /// @return Struct CuentaAutorizada completo.
    function obtenerCuenta(address _wallet) external view returns (CuentaAutorizada memory) {
        if (cuentas[_wallet].wallet == address(0)) revert CuentaNoExiste(_wallet);
        return cuentas[_wallet];
    }

    /// @notice Devuelve todas las cuentas activas en una sola llamada RPC.
    /// @return result Array de CuentaAutorizada filtrado solo a cuentas activas.
    function obtenerCuentasActivas() external view returns (CuentaAutorizada[] memory result) {
        uint256 total = listaDirecciones.length;
        result = new CuentaAutorizada[](total);
        uint256 count;
        for (uint256 i; i < total; ) {
            CuentaAutorizada storage c = cuentas[listaDirecciones[i]];
            if (c.wallet != address(0) && c.activa) {
                result[count] = c;
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        // Truncar al conteo real sin copiar el array completo
        assembly { mstore(result, count) }
    }

    /// @notice Actualiza el nombre de una cuenta existente.
    /// @param _wallet      Dirección de la cuenta.
    /// @param _nuevoNombre Nuevo nombre descriptivo.
    function actualizarCuenta(address _wallet, string calldata _nuevoNombre) external onlyOwner {
        if (cuentas[_wallet].wallet == address(0)) revert CuentaNoExiste(_wallet);

        cuentas[_wallet].nombre   = _nuevoNombre;
        cuentas[_wallet].fechaHora = uint64(block.timestamp);

        emit CuentaActualizada(_wallet, _nuevoNombre, block.timestamp);
    }

    /// @notice Elimina físicamente una cuenta del mapping.
    /// @param _wallet Dirección a eliminar.
    function eliminarCuenta(address _wallet) external onlyOwner {
        if (cuentas[_wallet].wallet == address(0)) revert CuentaNoExiste(_wallet);
        delete cuentas[_wallet];
        emit CuentaEliminada(_wallet, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ROLES
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Crea un nuevo rol.
    /// @param nombre Nombre del rol.
    /// @return nuevoId ID asignado al rol.
    function crearRol(string calldata nombre) external onlyCuentaAutorizada returns (uint32 nuevoId) {
        unchecked { nuevoId = ++_rolCounter; } // safe: uint32 overflow requeriría 4 bil. roles

        roles[nuevoId] = Rol({
            id:        nuevoId,
            activo:    true,
            ejecutor:  msg.sender,
            timestamp: uint64(block.timestamp),
            nombre:    nombre
        });
        _idsRoles.push(nuevoId);

        emit RolCreado(nuevoId, nombre, block.timestamp, msg.sender);
    }

    /// @notice Modifica el nombre de un rol existente.
    /// @param id     ID del rol a modificar.
    /// @param nombre Nuevo nombre del rol.
    function modificarRol(uint32 id, string calldata nombre) external onlyCuentaAutorizada {
        if (roles[id].id == 0) revert RolNoExiste(id);

        string memory nombreAnterior = roles[id].nombre;
        roles[id].nombre    = nombre;
        roles[id].timestamp = uint64(block.timestamp);
        roles[id].ejecutor  = msg.sender;

        emit RolModificado(id, nombreAnterior, nombre, block.timestamp, msg.sender);
    }

    /// @notice Inhabilita un rol (borrado lógico).
    /// @param id ID del rol a inhabilitar.
    function inhabilitarRol(uint32 id) external onlyCuentaAutorizada {
        if (roles[id].id == 0) revert RolNoExiste(id);

        roles[id].activo    = false;
        roles[id].timestamp = uint64(block.timestamp);
        roles[id].ejecutor  = msg.sender;

        emit RolInhabilitado(id, block.timestamp, msg.sender);
    }

    /// @notice Devuelve todos los roles en una sola llamada RPC.
    /// @return result Array de Rol (activos e inactivos).
    function obtenerTodosRoles() external view returns (Rol[] memory result) {
        uint256 total = _idsRoles.length;
        result = new Rol[](total);
        for (uint256 i; i < total; ) {
            result[i] = roles[_idsRoles[i]];
            unchecked { ++i; }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // USUARIOS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Crea un nuevo usuario y lo asocia a un rol.
    /// @param login  Identificador de login del usuario.
    /// @param nombre Nombre completo del usuario.
    /// @param rolId  ID del rol a asignar (debe existir y estar activo).
    /// @return nuevoId ID asignado al usuario.
    function crearUsuario(string calldata login, string calldata nombre, uint32 rolId)
        external
        onlyCuentaAutorizada
        returns (uint32 nuevoId)
    {
        if (roles[rolId].id == 0) revert RolNoExiste(rolId);
        if (!roles[rolId].activo)  revert RolInactivo(rolId);

        unchecked { nuevoId = ++_usuarioCounter; }

        usuarios[nuevoId] = Usuario({
            id:        nuevoId,
            rolId:     rolId,
            activo:    true,
            ejecutor:  msg.sender,
            timestamp: uint64(block.timestamp),
            login:     login,
            nombre:    nombre
        });
        _idsUsuarios.push(nuevoId);

        emit UsuarioCreado(nuevoId, login, nombre, rolId, block.timestamp, msg.sender);
    }

    /// @notice Modifica datos de un usuario existente.
    /// @param id     ID del usuario.
    /// @param login  Nuevo login.
    /// @param nombre Nuevo nombre.
    /// @param rolId  Nuevo rol (debe existir y estar activo).
    function modificarUsuario(uint32 id, string calldata login, string calldata nombre, uint32 rolId)
        external
        onlyCuentaAutorizada
    {
        if (usuarios[id].id == 0)  revert UsuarioNoExiste(id);
        if (roles[rolId].id == 0)  revert RolNoExiste(rolId);
        if (!roles[rolId].activo)   revert RolInactivo(rolId);

        uint32 rolIdAnterior    = usuarios[id].rolId;
        usuarios[id].login      = login;
        usuarios[id].nombre     = nombre;
        usuarios[id].rolId      = rolId;
        usuarios[id].timestamp  = uint64(block.timestamp);
        usuarios[id].ejecutor   = msg.sender;

        emit UsuarioModificado(id, login, nombre, rolIdAnterior, rolId, block.timestamp, msg.sender);
    }

    /// @notice Inhabilita un usuario (borrado lógico).
    /// @param id ID del usuario a inhabilitar.
    function inhabilitarUsuario(uint32 id) external onlyCuentaAutorizada {
        if (usuarios[id].id == 0) revert UsuarioNoExiste(id);

        usuarios[id].activo    = false;
        usuarios[id].timestamp = uint64(block.timestamp);
        usuarios[id].ejecutor  = msg.sender;

        emit UsuarioInhabilitado(id, block.timestamp, msg.sender);
    }

    /// @notice Devuelve todos los usuarios en una sola llamada RPC.
    /// @return result Array de Usuario (activos e inactivos).
    function obtenerTodosUsuarios() external view returns (Usuario[] memory result) {
        uint256 total = _idsUsuarios.length;
        result = new Usuario[](total);
        for (uint256 i; i < total; ) {
            result[i] = usuarios[_idsUsuarios[i]];
            unchecked { ++i; }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MENÚS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Crea un nuevo menú.
    /// @param nombre Nombre del menú.
    /// @return nuevoId ID asignado al menú.
    function crearMenu(string calldata nombre) external onlyCuentaAutorizada returns (uint32 nuevoId) {
        unchecked { nuevoId = ++_menuCounter; }

        menus[nuevoId] = Menu({
            id:        nuevoId,
            activo:    true,
            ejecutor:  msg.sender,
            timestamp: uint64(block.timestamp),
            nombre:    nombre
        });
        _idsMenus.push(nuevoId);

        emit MenuCreado(nuevoId, nombre, block.timestamp, msg.sender);
    }

    /// @notice Modifica el nombre de un menú existente.
    /// @param id     ID del menú.
    /// @param nombre Nuevo nombre.
    function modificarMenu(uint32 id, string calldata nombre) external onlyCuentaAutorizada {
        if (menus[id].id == 0) revert MenuNoExiste(id);

        string memory nombreAnterior = menus[id].nombre;
        menus[id].nombre    = nombre;
        menus[id].timestamp = uint64(block.timestamp);
        menus[id].ejecutor  = msg.sender;

        emit MenuModificado(id, nombreAnterior, nombre, block.timestamp, msg.sender);
    }

    /// @notice Inhabilita un menú (borrado lógico).
    /// @param id ID del menú a inhabilitar.
    function inhabilitarMenu(uint32 id) external onlyCuentaAutorizada {
        if (menus[id].id == 0) revert MenuNoExiste(id);

        menus[id].activo    = false;
        menus[id].timestamp = uint64(block.timestamp);
        menus[id].ejecutor  = msg.sender;

        emit MenuInhabilitado(id, block.timestamp, msg.sender);
    }

    /// @notice Devuelve todos los menús en una sola llamada RPC.
    /// @return result Array de Menu (activos e inactivos).
    function obtenerTodosMenus() external view returns (Menu[] memory result) {
        uint256 total = _idsMenus.length;
        result = new Menu[](total);
        for (uint256 i; i < total; ) {
            result[i] = menus[_idsMenus[i]];
            unchecked { ++i; }
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MENÚ-ROL
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Vincula un menú a un rol.
    /// @param rolId  ID del rol.
    /// @param menuId ID del menú.
    function vincularMenuARol(uint32 rolId, uint32 menuId) external onlyCuentaAutorizada {
        if (roles[rolId].id == 0)                       revert RolNoExiste(rolId);
        if (menus[menuId].id == 0)                      revert MenuNoExiste(menuId);
        if (menuRolAsociacion[rolId][menuId].activo)    revert MenuYaVinculado(rolId, menuId);

        menuRolAsociacion[rolId][menuId] = MenuRol({menuId: menuId, rolId: rolId, activo: true});

        // Agregar al array solo si nunca fue vinculado antes.
        // Evita duplicados cuando un menú se desvincula y re-vincula al mismo rol.
        if (!_menuEnArrayRol[rolId][menuId]) {
            menusPorRol[rolId].push(menuId);
            _menuEnArrayRol[rolId][menuId] = true;
        }

        emit MenuVinculadoARol(rolId, menuId, block.timestamp, msg.sender);
    }

    /// @notice Desvincula un menú de un rol.
    /// @param rolId  ID del rol.
    /// @param menuId ID del menú.
    function desvincularMenuDeRol(uint32 rolId, uint32 menuId) external onlyCuentaAutorizada {
        if (roles[rolId].id == 0)                        revert RolNoExiste(rolId);
        if (menus[menuId].id == 0)                       revert MenuNoExiste(menuId);
        if (!menuRolAsociacion[rolId][menuId].activo)    revert MenuNoVinculado(rolId, menuId);

        menuRolAsociacion[rolId][menuId].activo = false;

        emit MenuDesvinculadoDeRol(rolId, menuId, block.timestamp, msg.sender);
    }

    /// @notice Devuelve todos los IDs de menús del rol (activos e inactivos).
    /// @param rolId ID del rol.
    /// @return Array de menuIds sin filtrar.
    function obtenerMenusPorRol(uint32 rolId) external view returns (uint32[] memory) {
        return menusPorRol[rolId];
    }

    /// @notice Devuelve solo los IDs de menús activamente vinculados al rol.
    ///         Reemplaza N llamadas a verificarAcceso() por una sola llamada RPC.
    /// @param rolId ID del rol.
    /// @return activos Array de menuIds con vinculación activa.
    function obtenerMenusActivosPorRol(uint32 rolId) external view returns (uint32[] memory activos) {
        uint32[] storage todos = menusPorRol[rolId];
        uint256 total = todos.length;
        activos = new uint32[](total);
        uint256 count;
        for (uint256 i; i < total; ) {
            uint32 menuId = todos[i];
            if (menuRolAsociacion[rolId][menuId].activo) {
                activos[count] = menuId;
                unchecked { ++count; }
            }
            unchecked { ++i; }
        }
        assembly { mstore(activos, count) }
    }

    /// @notice Verifica si un rol tiene acceso activo a un menú.
    /// @param rolId  ID del rol.
    /// @param menuId ID del menú.
    /// @return true si la vinculación está activa.
    function verificarAcceso(uint32 rolId, uint32 menuId) external view returns (bool) {
        return menuRolAsociacion[rolId][menuId].activo;
    }
}
