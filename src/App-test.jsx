import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [users, setUsers] = useState([
    { id: '1', name: 'Juan Pérez', age: '25', isActive: true },
    { id: '2', name: 'María García', age: '30', isActive: true },
    { id: '3', name: 'Carlos López', age: '28', isActive: false }
  ]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span style={{ fontSize: '32px' }}>👥</span>
            <h1>Gestión de Usuarios - TEST</h1>
          </div>
          <div className="connection-status">
            <div className="status-indicator connected"></div>
            <span>Modo Prueba</span>
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
        {activeTab === 'list' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span style={{ fontSize: '24px' }}>👥</span>
                Lista de Usuarios ({users.length})
              </div>
            </div>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Edad</th>
                    <th>Estado</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <p>Formulario de creación de usuario (modo prueba)</p>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span style={{ fontSize: '24px' }}>🔍</span>
                Buscar Usuario
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              <p>Búsqueda de usuario (modo prueba)</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
