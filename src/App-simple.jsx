import React from 'react';

function App() {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        color: 'black',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#4f46e5', textAlign: 'center', marginBottom: '30px' }}>
          🎉 ¡Aplicación React Funcionando!
        </h1>
        
        <div style={{
          background: '#dcfce7',
          color: '#166534',
          padding: '15px',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          ✅ React + Vite está funcionando correctamente
        </div>
        
        <div style={{
          background: '#f0f9ff',
          color: '#0369a1',
          padding: '20px',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>📋 Estado de la Aplicación:</h3>
          <ul>
            <li>✅ Servidor Vite ejecutándose en puerto 3000</li>
            <li>✅ React renderizando correctamente</li>
            <li>✅ Estilos CSS aplicados</li>
            <li>⏳ Conexión a blockchain pendiente</li>
          </ul>
        </div>
        
        <div style={{
          background: '#fef3c7',
          color: '#92400e',
          padding: '20px',
          borderRadius: '5px'
        }}>
          <h3>🔧 Próximos Pasos:</h3>
          <ol>
            <li>Verificar que Anvil esté ejecutándose en localhost:8545</li>
            <li>Cambiar de App-simple.jsx a App.jsx para funcionalidad completa</li>
            <li>Probar las operaciones CRUD con la blockchain</li>
          </ol>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button 
            onClick={() => alert('¡Botón funcionando!')}
            style={{
              background: '#4f46e5',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🚀 Probar Interactividad
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
