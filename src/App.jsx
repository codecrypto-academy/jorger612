import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Empresas from './components/Empresas.jsx';
import Clientes from './components/Clientes.jsx';
import Productos from './components/Productos.jsx';
import Carrito from './components/Carrito.jsx';

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('empresas');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  // Función para agregar al carrito
  const agregarAlCarrito = (producto, cantidad) => {
    const precioTotal = parseFloat(producto.precio) * cantidad;
    const itemCarrito = {
      id: producto.id,
      nombre: producto.nombre,
      direccionEmpresa: producto.direccionEmpresa,
      imagen: producto.imagen,
      cantidad: cantidad,
      precioUnitario: producto.precio,
      precioTotal: precioTotal
    };
    
    setCarrito(prevCarrito => [...prevCarrito, itemCarrito]);
    setStatus({
      type: 'success',
      message: `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'} de ${producto.nombre} agregada al carrito`
    });
  };

  // Función para eliminar del carrito
  const eliminarDelCarrito = (index) => {
    setCarrito(prevCarrito => prevCarrito.filter((_, i) => i !== index));
    setStatus({
      type: 'success',
      message: 'Producto eliminado del carrito'
    });
  };

  // Conectar a MetaMask
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        setProvider(provider);
        setAccount(accounts[0]);
        
        setStatus({
          type: 'success',
          message: 'Wallet conectada exitosamente!'
        });
      } else {
        setStatus({
          type: 'error',
          message: 'Por favor instala MetaMask para usar esta aplicación'
        });
      }
    } catch (error) {
      console.error('Error conectando wallet:', error);
      setStatus({
        type: 'error',
        message: 'Error conectando wallet: ' + error.message
      });
    }
  };



  // Escuchar cambios en la cuenta
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount('');
          setProvider(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>🏢 Gestión de Empresas</h1>
        <p>Gestiona empresas en la blockchain de Ethereum</p>
      </div>

      {!account ? (
        <div className="card">
          <h2>Conectar Wallet</h2>
          <p>Para usar esta aplicación, necesitas conectar tu wallet de MetaMask.</p>
          <button className="btn" onClick={connectWallet}>
            🔗 Conectar MetaMask
          </button>
        </div>
      ) : (
        <>
          {/* Componente del carrito */}
          <Carrito 
            carrito={carrito}
            eliminarDelCarrito={eliminarDelCarrito}
            mostrarCarrito={mostrarCarrito}
            setMostrarCarrito={setMostrarCarrito}
          />

          <div className="wallet-info">
            <h3>Wallet Conectada</h3>
            <p><strong>Dirección:</strong> {account}</p>
            <p><strong>Red:</strong> {provider?.network?.name || 'Conectando...'}</p>
          </div>

          <div className="menu-container">
                                    <div className="menu-tabs">
                          <button 
                            className={`menu-tab ${activeTab === 'empresas' ? 'active' : ''}`}
                            onClick={() => setActiveTab('empresas')}
                          >
                            🏢 Empresas
                          </button>
                          <button 
                            className={`menu-tab ${activeTab === 'clientes' ? 'active' : ''}`}
                            onClick={() => setActiveTab('clientes')}
                          >
                            👥 Clientes
                          </button>
                          <button 
                            className={`menu-tab ${activeTab === 'productos' ? 'active' : ''}`}
                            onClick={() => setActiveTab('productos')}
                          >
                            📦 Productos
                          </button>
                        </div>
            
                                    <div className="tab-content">
                          {activeTab === 'empresas' && (
                            <Empresas provider={provider} account={account} />
                          )}
                          {activeTab === 'clientes' && (
                            <Clientes provider={provider} account={account} />
                          )}
                          {activeTab === 'productos' && (
                            <Productos 
                              provider={provider} 
                              account={account} 
                              agregarAlCarrito={agregarAlCarrito}
                            />
                          )}
                        </div>
          </div>
        </>
      )}

      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default App;
