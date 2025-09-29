import React, { useState, useEffect } from 'react';
import './App.css';
import UserForm from './components/UserForm';
import UserList from './components/UserList';
import UserDetails from './components/UserDetails';
import SearchModule from './components/SearchModule';
import ethersService from './services/ethersService';

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [searchId, setSearchId] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [forceRender, setForceRender] = useState(0);
  const [searchModuleKey, setSearchModuleKey] = useState(0);

  useEffect(() => {
    initializeEthers();
  }, []);

  // Forzar re-renderizado cuando cambie el usuario seleccionado
  useEffect(() => {
    if (selectedUser && searchPerformed) {
      console.log('Usuario seleccionado actualizado:', selectedUser);
      setForceRender(prev => prev + 1);
    }
  }, [selectedUser, searchPerformed]);

  // Forzar re-renderizado cuando se complete la búsqueda
  useEffect(() => {
    if (searchPerformed && !loading) {
      console.log('Búsqueda completada, forzando renderizado');
      setForceRender(prev => prev + 1);
    }
  }, [searchPerformed, loading]);

  const initializeEthers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Iniciando conexión a blockchain con Ethers.js...');
      
      await ethersService.initialize();
      console.log('Ethers.js inicializado correctamente');
      
      setIsConnected(true);
      console.log('Estado de conexión actualizado');
      
      await loadUsers();
      console.log('Usuarios cargados correctamente');
      
    } catch (err) {
      console.error('Error en initializeEthers:', err);
      setError(`Error conectando a blockchain: ${err.message}`);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Cargando usuarios desde blockchain...');
      const usersData = await ethersService.getAllUsers();
      console.log('Usuarios cargados:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError(`Error cargando usuarios: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = async () => {
    await loadUsers();
    setActiveTab('list');
  };

  const handleUserUpdated = async () => {
    await loadUsers();
    setActiveTab('list');
  };

  const handleUserDeleted = async () => {
    await loadUsers();
    setSelectedUser(null);
    setActiveTab('list');
  };

  const handleSearchUser = async () => {
    if (!searchId.trim()) {
      setError('Por favor ingrese un ID de usuario');
      return;
    }

    console.log('=== INICIANDO BÚSQUEDA ===');
    console.log('ID a buscar:', searchId);
    
    // Forzar re-renderizado completo del módulo de búsqueda
    setSearchModuleKey(prev => prev + 1);
    setForceRender(prev => prev + 1);
    
    // Reset completo de estados
    setError(null);
    setSelectedUser(null);
    setSearchPerformed(false);
    setLoading(true);
    
    try {
      console.log('Ejecutando búsqueda en blockchain...');
      const user = await ethersService.getUserById(searchId);
      console.log('Usuario obtenido del contrato:', user);
      
      // Forzar múltiples re-renderizados
      setSearchModuleKey(prev => prev + 1);
      setForceRender(prev => prev + 1);
      
      // Actualizar estados de forma síncrona
      setSelectedUser(user);
      setSearchPerformed(true);
      setError(null);
      setRefreshKey(prev => prev + 1);
      
      console.log('Estados actualizados, forzando renderizado del módulo...');
      
      // Forzar renderizado adicional del módulo
      setSearchModuleKey(prev => prev + 1);
      
      // Cambio inmediato de pestaña
      setActiveTab('details');
      
      // Forzar renderizado final con múltiples triggers
      setTimeout(() => {
        setSearchModuleKey(prev => prev + 1);
        setForceRender(prev => prev + 1);
        console.log('Renderizado final del módulo forzado');
      }, 100);
      
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setError(`Usuario no encontrado: ${err.message}`);
      setSelectedUser(null);
      setSearchPerformed(true);
      setSearchModuleKey(prev => prev + 1);
      setForceRender(prev => prev + 1);
    } finally {
      setLoading(false);
      console.log('=== BÚSQUEDA COMPLETADA ===');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearSearch = () => {
    setSearchId('');
    setSelectedUser(null);
    setError(null);
    setSearchPerformed(false);
    setSearchModuleKey(prev => prev + 1);
    setForceRender(prev => prev + 1);
  };

  if (!isConnected) {
    return (
      <div className="app">
      <div className="connection-error">
        <span style={{ fontSize: '48px' }}>⚠️</span>
        <h2>Connection Error</h2>
        <p>Unable to connect to the blockchain. Please make sure Anvil is running on localhost:8545</p>
        <button onClick={initializeEthers} className="retry-btn">
          Retry Connection
        </button>
      </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
        <div className="logo">
          <span style={{ fontSize: '32px' }}>👥</span>
          <h1>Gestión de Usuarios</h1>
        </div>
          <div className="connection-status">
            <div className="status-indicator connected"></div>
            <span>Conectado a Anvil</span>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={`nav-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Lista de Usuarios
        </button>
        <button 
          className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          ➕ Crear Usuario
        </button>
        <button 
          className={`nav-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Buscar Usuario
        </button>
      </nav>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={clearError} className="close-btn">×</button>
          </div>
        )}

        {activeTab === 'list' && (
          <UserList 
            users={users} 
            loading={loading}
            onUserSelect={setSelectedUser}
            onUserDeleted={handleUserDeleted}
            onRefresh={loadUsers}
          />
        )}

        {activeTab === 'create' && (
          <UserForm 
            onUserCreated={handleUserCreated}
            loading={loading}
          />
        )}

        {activeTab === 'search' && (
          <SearchModule
            key={`search-module-${searchModuleKey}-${forceRender}`}
            searchId={searchId}
            setSearchId={setSearchId}
            handleSearchUser={handleSearchUser}
            clearSearch={clearSearch}
            loading={loading}
            error={error}
            selectedUser={selectedUser}
            searchPerformed={searchPerformed}
            onUserUpdated={handleUserUpdated}
            onUserDeleted={handleUserDeleted}
          />
        )}
      </main>
    </div>
  );
}

export default App;
