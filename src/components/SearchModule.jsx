import React from 'react';
import UserDetails from './UserDetails';

const SearchModule = ({ 
  searchId, 
  setSearchId, 
  handleSearchUser, 
  clearSearch, 
  loading, 
  error, 
  selectedUser, 
  searchPerformed, 
  onUserUpdated, 
  onUserDeleted 
}) => {
  console.log('SearchModule renderizado con:', { searchId, loading, selectedUser, searchPerformed });
  
  return (
    <div className="search-section">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span style={{ fontSize: '24px' }}>🔍</span>
            Buscar Usuario por ID
          </div>
        </div>
        
        <div className="search-form">
          <input
            type="number"
            placeholder="Ingrese ID del usuario"
            value={searchId}
            onChange={(e) => {
              setSearchId(e.target.value);
              // No limpiar aquí para evitar conflictos
            }}
            className="search-input"
            disabled={loading}
          />
          <button 
            onClick={handleSearchUser}
            disabled={loading || !searchId.trim()}
            className="search-btn"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          <button 
            onClick={clearSearch}
            disabled={loading}
            className="btn btn-secondary"
          >
            Limpiar
          </button>
        </div>
        
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Buscando usuario...</p>
          </div>
        )}
        
        {!loading && searchPerformed && !selectedUser && !error && (
          <div className="empty-state">
            <span style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '1rem', display: 'block' }}>👤</span>
            <h3>No se encontró usuario</h3>
            <p>Intenta con un ID diferente o verifica que el usuario exista.</p>
          </div>
        )}
      </div>
      
      {selectedUser && !loading && searchPerformed && (
        <div style={{ marginTop: '1rem' }}>
          <UserDetails 
            user={selectedUser}
            onUserUpdated={onUserUpdated}
            onUserDeleted={onUserDeleted}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default SearchModule;
