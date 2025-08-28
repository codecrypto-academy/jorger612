import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI_CLIENTE from '../ABI_CLIENTE';

const CONTRACT_ADDRESS = '0xB107b0687D020BC5efDB59D41c7C1bE289Ba26eD';

function Clientes({ provider, account }) {
  const [contract, setContract] = useState(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');
  const [clientes, setClientes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Inicializar contrato cuando se conecte la wallet
  useEffect(() => {
    if (provider && account) {
      const initContract = async () => {
        try {
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI_CLIENTE, signer);
          setContract(contractInstance);
          await cargarClientes(contractInstance);
        } catch (error) {
          console.error('Error inicializando contrato:', error);
        }
      };
      initContract();
    }
  }, [provider, account]);

  // Cargar empresas para el selector
  useEffect(() => {
    if (provider && account) {
      cargarEmpresas();
    }
  }, [provider, account]);

  // Cargar empresas desde el contrato de empresas
  const cargarEmpresas = async () => {
    try {
      const empresaContract = new ethers.Contract(
        '0x73Ae10E84468c30e564A02d6e18068D10854A333',
        [
          {
            "inputs": [],
            "name": "consultarTodasLasEmpresas",
            "outputs": [
              {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
              },
              {
                "internalType": "string[]",
                "name": "",
                "type": "string[]"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ],
        provider
      );

      const [direcciones, nombres] = await empresaContract.consultarTodasLasEmpresas();
      const empresasData = direcciones.map((direccion, index) => ({
        direccion: direccion,
        nombre: nombres[index]
      }));
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Error cargando empresas:', error);
    }
  };

  // Agregar nuevo cliente
  const agregarCliente = async (e) => {
    e.preventDefault();
    
    if (!clienteNombre.trim()) {
      setStatus({
        type: 'error',
        message: 'Por favor ingresa el nombre del cliente'
      });
      return;
    }

    if (!empresaSeleccionada) {
      setStatus({
        type: 'error',
        message: 'Por favor selecciona una empresa'
      });
      return;
    }

    if (!contract) {
      setStatus({
        type: 'error',
        message: 'Por favor conecta tu wallet primero'
      });
      return;
    }

    setLoading(true);
    try {
      const tx = await contract.agregarCliente(empresaSeleccionada, clienteNombre);
      setStatus({
        type: 'info',
        message: 'Transacción enviada! Esperando confirmación...'
      });
      
      await tx.wait();
      
      setStatus({
        type: 'success',
        message: 'Cliente agregado exitosamente!'
      });
      
      setClienteNombre('');
      setEmpresaSeleccionada('');
      await cargarClientes(contract);
    } catch (error) {
      console.error('Error agregando cliente:', error);
      setStatus({
        type: 'error',
        message: 'Error agregando cliente: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar todos los clientes
  const cargarClientes = async (contractInstance = contract) => {
    if (!contractInstance) return;
    
    try {
      setLoading(true);
      const [direccionesClientes, direccionesEmpresas, nombres] = await contractInstance.consultarTodasLosClientes();
      
      const clientesData = direccionesClientes.map((dirCliente, index) => ({
        dirCliente: dirCliente,
        dirEmpresa: direccionesEmpresas[index],
        nombre: nombres[index]
      }));
      
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setStatus({
        type: 'error',
        message: 'Error cargando clientes: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>➕ Agregar Nuevo Cliente</h2>
        <form onSubmit={agregarCliente}>
          <div className="form-group">
            <label htmlFor="clienteNombre">Nombre del Cliente:</label>
            <input
              type="text"
              id="clienteNombre"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              placeholder="Ingresa el nombre del cliente"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="empresaSeleccionada">Empresa:</label>
            <select
              id="empresaSeleccionada"
              value={empresaSeleccionada}
              onChange={(e) => setEmpresaSeleccionada(e.target.value)}
              disabled={loading}
              required
            >
              <option value="">Selecciona una empresa</option>
              {empresas.map((empresa, index) => (
                <option key={index} value={empresa.direccion}>
                  {empresa.nombre} ({empresa.direccion})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            className="btn" 
            disabled={loading || !clienteNombre.trim() || !empresaSeleccionada}
          >
            {loading ? 'Procesando...' : 'Agregar Cliente'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>📋 Lista de Clientes</h2>
        <button 
          className="btn btn-secondary" 
          onClick={() => cargarClientes()}
          disabled={loading}
          style={{ marginBottom: '20px' }}
        >
          🔄 Actualizar Lista
        </button>
        
        {loading ? (
          <div className="loading">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <p>No hay clientes registrados aún.</p>
        ) : (
          <div className="empresas-grid">
            {clientes.map((cliente, index) => (
              <div key={index} className="empresa-item">
                <h3>{cliente.nombre}</h3>
                <p><strong>Dirección Cliente:</strong> {cliente.dirCliente}</p>
                <p><strong>Empresa:</strong> {cliente.dirEmpresa}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default Clientes;
