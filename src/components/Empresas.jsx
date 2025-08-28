import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI_EMPRESA from '../ABI_EMPRESA';

const CONTRACT_ADDRESS = '0x73Ae10E84468c30e564A02d6e18068D10854A333';

function Empresas({ provider, account }) {
  const [contract, setContract] = useState(null);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Inicializar contrato cuando se conecte la wallet
  useEffect(() => {
    if (provider && account) {
      const initContract = async () => {
        try {
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI_EMPRESA, signer);
          setContract(contractInstance);
          await cargarEmpresas(contractInstance);
        } catch (error) {
          console.error('Error inicializando contrato:', error);
        }
      };
      initContract();
    }
  }, [provider, account]);

  // Agregar nueva empresa
  const agregarEmpresa = async (e) => {
    e.preventDefault();
    
    if (!empresaNombre.trim()) {
      setStatus({
        type: 'error',
        message: 'Por favor ingresa el nombre de la empresa'
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
      const tx = await contract.agregarEmpresa(empresaNombre);
      setStatus({
        type: 'info',
        message: 'Transacción enviada! Esperando confirmación...'
      });
      
      await tx.wait();
      
      setStatus({
        type: 'success',
        message: 'Empresa agregada exitosamente!'
      });
      
      setEmpresaNombre('');
      await cargarEmpresas(contract);
    } catch (error) {
      console.error('Error agregando empresa:', error);
      setStatus({
        type: 'error',
        message: 'Error agregando empresa: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar todas las empresas
  const cargarEmpresas = async (contractInstance = contract) => {
    if (!contractInstance) return;
    
    try {
      setLoading(true);
      const [direcciones, nombres] = await contractInstance.consultarTodasLasEmpresas();
      
      const empresasData = direcciones.map((direccion, index) => ({
        direccion: direccion,
        nombre: nombres[index]
      }));
      
      setEmpresas(empresasData);
    } catch (error) {
      console.error('Error cargando empresas:', error);
      setStatus({
        type: 'error',
        message: 'Error cargando empresas: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>➕ Agregar Nueva Empresa</h2>
        <form onSubmit={agregarEmpresa}>
          <div className="form-group">
            <label htmlFor="empresaNombre">Nombre de la Empresa:</label>
            <input
              type="text"
              id="empresaNombre"
              value={empresaNombre}
              onChange={(e) => setEmpresaNombre(e.target.value)}
              placeholder="Ingresa el nombre de la empresa"
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn" 
            disabled={loading || !empresaNombre.trim()}
          >
            {loading ? 'Procesando...' : 'Agregar Empresa'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>📋 Lista de Empresas</h2>
        <button 
          className="btn btn-secondary" 
          onClick={() => cargarEmpresas()}
          disabled={loading}
          style={{ marginBottom: '20px' }}
        >
          🔄 Actualizar Lista
        </button>
        
        {loading ? (
          <div className="loading">Cargando empresas...</div>
        ) : empresas.length === 0 ? (
          <p>No hay empresas registradas aún.</p>
        ) : (
          <div className="empresas-grid">
            {empresas.map((empresa, index) => (
              <div key={index} className="empresa-item">
                <h3>{empresa.nombre}</h3>
                <p><strong>Dirección:</strong> {empresa.direccion}</p>
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

export default Empresas;
