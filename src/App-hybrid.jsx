import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list');
  const [searchId, setSearchId] = useState('');
  const [web3Service, setWeb3Service] = useState(null);

  useEffect(() => {
    initializeWeb3();
  }, []);

  const initializeWeb3 = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carga de Web3
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Intentar cargar Web3 dinámicamente
      try {
        const { default: web3ServiceModule } = await import('./services/web3Service');
        await web3ServiceModule.initialize();
        setWeb3Service(web3ServiceModule);
        setIsConnected(true);
        await loadUsers();
      } catch (web3Error) {
        console.warn('Web3 no disponible, usando modo simulación:', web3Error);
        setIsConnected(true); // Permitir usar la app en modo simulación
        setUsers([
          { id: '1', name: 'Usuario Demo 1', age: '25', isActive: true },
          { id: '2', name: 'Usuario Demo 2', age: '30', isActive: true }
        ]);
      }
    } catch (err) {
      setError(`Error inicializando: ${err.message}`);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!web3Service) {
      // Modo simulación
      setUsers([
        { id: '1', name: 'Usuario Demo 1', age: '25', isActive: true },
        { id: '2', name: 'Usuario Demo 2', age: '30', isActive: true }
      ]);
      return;
    }

    try {
      setLoading(true);
      const usersData = await web3Service.getAllUsers();
      setUsers(usersData);
    } catch (err) {
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

    try {
      setLoading(true);
      setError(null);
      
      if (web3Service) {
        const user = await web3Service.getUserById(searchId);
        setSelectedUser(user);
      } else {
        // Modo simulación
        const user = users.find(u => u.id === searchId);
        if (user) {
          setSelectedUser(user);
        } else {
          setError('Usuario no encontrado');
        }
      }
      setActiveTab('details');
    } catch (err) {
      setError(`Usuario no encontrado: ${err.message}`);
      setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  if (loading && !isConnected) {
    return (
      <div className="app">
        <div className="connection-error">
          <span style={{ fontSize: '48px' }}>⏳</span>
          <h2>Cargando Aplicación</h2>
          <p>Inicializando conexión a blockchain...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="app">
        <div className="connection-error">
          <span style={{ fontSize: '48px' }}>⚠️</span>
          <h2>Error de Conexión</h2>
          <p>No se pudo conectar a la blockchain. Verifica que Anvil esté ejecutándose en localhost:8545</p>
          <button onClick={initializeWeb3} className="retry-btn">
            Reintentar Conexión
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
            <span>{web3Service ? 'Conectado a Anvil' : 'Modo Simulación'}</span>
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
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span style={{ fontSize: '24px' }}>👥</span>
                Lista de Usuarios ({users.length})
              </div>
              <button
                onClick={loadUsers}
                className="btn btn-secondary"
                disabled={loading}
              >
                <span>🔄</span>
                Actualizar
              </button>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <span style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '1rem', display: 'block' }}>👥</span>
                <h3>No hay usuarios registrados</h3>
                <p>Los usuarios que crees aparecerán aquí.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Edad</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.age}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                            {user.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="btn btn-secondary"
                              style={{ padding: '0.5rem' }}
                              title="Ver detalles"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => alert('Funcionalidad de edición en desarrollo')}
                              className="btn btn-primary"
                              style={{ padding: '0.5rem' }}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => alert('Funcionalidad de eliminación en desarrollo')}
                              className="btn btn-danger"
                              style={{ padding: '0.5rem' }}
                              title="Eliminar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span style={{ fontSize: '24px' }}>👤</span>
                Crear Nuevo Usuario
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              <p>Formulario de creación de usuario</p>
              <p><strong>Estado:</strong> {web3Service ? 'Conectado a blockchain' : 'Modo simulación'}</p>
              <button 
                onClick={() => alert('Funcionalidad de creación en desarrollo')}
                className="btn btn-primary"
              >
                <span>💾</span>
                Crear Usuario
              </button>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="search-section">
            <div className="search-form">
              <input
                type="number"
                placeholder="Ingrese ID del usuario"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="search-input"
              />
              <button 
                onClick={handleSearchUser}
                disabled={loading}
                className="search-btn"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            
            {selectedUser && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <span style={{ fontSize: '24px' }}>👤</span>
                    Detalles del Usuario
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">ID del Usuario</label>
                    <div style={{ 
                      padding: '0.75rem 1rem', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem',
                      fontFamily: 'monospace',
                      fontSize: '1rem'
                    }}>
                      {selectedUser.id}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <div style={{ 
                      padding: '0.75rem 1rem', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      {selectedUser.name}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Edad</label>
                    <div style={{ 
                      padding: '0.75rem 1rem', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      {selectedUser.age} años
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <div style={{ 
                      padding: '0.75rem 1rem', 
                      background: '#f9fafb', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}>
                      <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                        {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
