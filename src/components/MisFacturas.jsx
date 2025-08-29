import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI_FACTURA from '../ABI_FACTURA';

const CONTRACT_FACTURA_ADDRESS = '0xcbdA2B3fD6E2ce70ACfF3158F16503AC043dFA19';

function MisFacturas({ provider, account }) {
  const [contractFactura, setContractFactura] = useState(null);
  const [misFacturas, setMisFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Inicializar contrato cuando se conecte la wallet
  useEffect(() => {
    if (provider && account) {
      const initContract = async () => {
        try {
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_FACTURA_ADDRESS, ABI_FACTURA, signer);
          setContractFactura(contractInstance);
          await cargarMisFacturas(contractInstance);
        } catch (error) {
          console.error('Error inicializando contrato:', error);
        }
      };
      initContract();
    }
  }, [provider, account]);

  // Cargar empresas y clientes para los filtros
  useEffect(() => {
    if (provider && account) {
      cargarEmpresas();
      cargarClientes();
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

  // Cargar clientes para el filtro
  const cargarClientes = async () => {
    try {
      const clienteContract = new ethers.Contract(
        '0xB107b0687D020BC5efDB59D41c7C1bE289Ba26eD',
        [
          {
            "inputs": [],
            "name": "consultarTodasLosClientes",
            "outputs": [
              {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
              },
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

      const [direccionesClientes, direccionesEmpresas, nombres] = await clienteContract.consultarTodasLosClientes();
      const clientesData = direccionesClientes.map((dirCliente, index) => ({
        direccion: dirCliente,
        nombre: nombres[index],
        empresa: direccionesEmpresas[index]
      }));
      setClientes(clientesData);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  // Cargar mis facturas
  const cargarMisFacturas = async (contractInstance = contractFactura) => {
    if (!contractInstance) return;
    
    try {
      setLoading(true);
      
      // Obtener todas las facturas del cliente
      const [numerosFacturas, fechasFacturas, totalesFacturas] = await contractInstance.consultarTodasLasFacturasXcliente(account);
      
      // Obtener información adicional de cada factura
      const facturasConDetalles = await Promise.all(
        numerosFacturas.map(async (numFactura, index) => {
          try {
            // Obtener detalles completos de la factura
            const [dirEmpresa, numFact, fechaFact, dirCliente, totalFact] = await contractInstance.facturas(numFactura);
            
            return {
              numeroFactura: numFactura.toString(),
              fechaFactura: fechasFacturas[index] || fechaFact,
              importeTotal: ethers.formatEther(totalesFacturas[index] || totalFact),
              direccionEmpresa: dirEmpresa,
              direccionCliente: dirCliente,
              nombreEmpresa: obtenerNombreEmpresa(dirEmpresa)
            };
          } catch (error) {
            // Si no se puede obtener detalles completos, usar los datos básicos
            return {
              numeroFactura: numFactura.toString(),
              fechaFactura: fechasFacturas[index],
              importeTotal: ethers.formatEther(totalesFacturas[index]),
              direccionEmpresa: '',
              direccionCliente: account,
              nombreEmpresa: 'Empresa no encontrada'
            };
          }
        })
      );
      
      setMisFacturas(facturasConDetalles);
      
      if (facturasConDetalles.length === 0) {
        setStatus({
          type: 'info',
          message: 'No tienes facturas registradas aún.'
        });
      } else {
        setStatus({
          type: 'success',
          message: `Se encontraron ${facturasConDetalles.length} factura(s)`
        });
      }
    } catch (error) {
      console.error('Error cargando facturas:', error);
      setStatus({
        type: 'error',
        message: 'Error cargando facturas: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener nombre de empresa por dirección
  const obtenerNombreEmpresa = (direccion) => {
    const empresa = empresas.find(emp => emp.direccion.toLowerCase() === direccion.toLowerCase());
    return empresa ? empresa.nombre : 'Empresa no encontrada';
  };

  // Obtener nombre de cliente por dirección
  const obtenerNombreCliente = (direccion) => {
    const cliente = clientes.find(cli => cli.direccion.toLowerCase() === direccion.toLowerCase());
    return cliente ? cliente.nombre : 'Cliente no encontrado';
  };

  // Filtrar facturas por empresa y cliente
  const facturasFiltradas = misFacturas.filter(factura => {
    const cumpleFiltroEmpresa = !filtroEmpresa || 
      factura.direccionEmpresa.toLowerCase() === filtroEmpresa.toLowerCase();
    
    const cumpleFiltroCliente = !filtroCliente || 
      factura.direccionCliente.toLowerCase() === filtroCliente.toLowerCase();
    
    return cumpleFiltroEmpresa && cumpleFiltroCliente;
  });

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return fecha; // Si no es una fecha válida, devolver el string original
      }
      return fechaObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return fecha;
    }
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroEmpresa('');
    setFiltroCliente('');
  };

  return (
    <div>
      <div className="card">
        <h2>📄 Mis Facturas</h2>
        <div className="info-message">
          💡 <strong>Visualiza todas las facturas que has generado en tus compras</strong>
        </div>
        
        <div className="filtros-container">
          <div className="form-group">
            <label htmlFor="filtroEmpresa">Filtrar por Empresa:</label>
            <select
              id="filtroEmpresa"
              value={filtroEmpresa}
              onChange={(e) => setFiltroEmpresa(e.target.value)}
            >
              <option value="">Todas las empresas</option>
              {empresas.map((empresa, index) => (
                <option key={index} value={empresa.direccion}>
                  {empresa.nombre} ({empresa.direccion})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="filtroCliente">Filtrar por Cliente:</label>
            <select
              id="filtroCliente"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
            >
              <option value="">Todos los clientes</option>
              {clientes.map((cliente, index) => (
                <option key={index} value={cliente.direccion}>
                  {cliente.nombre} ({cliente.direccion})
                </option>
              ))}
            </select>
          </div>
          
          <div className="filtros-buttons">
            <button 
              className="btn btn-secondary" 
              onClick={() => cargarMisFacturas()}
              disabled={loading}
            >
              🔄 Actualizar Facturas
            </button>
            
            {(filtroEmpresa || filtroCliente) && (
              <button 
                className="btn btn-secondary btn-limpiar" 
                onClick={limpiarFiltros}
              >
                🗑️ Limpiar Filtros
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando tus facturas...</div>
        ) : (
          <>
            {status.message && (
              <div className={`status ${status.type}`}>
                {status.message}
              </div>
            )}
            
            {facturasFiltradas.length === 0 ? (
              <div className="no-facturas">
                <p>No se encontraron facturas{
                  filtroEmpresa || filtroCliente 
                    ? ` con los filtros aplicados` 
                    : ''
                }.</p>
              </div>
            ) : (
              <div className="facturas-grid">
                {facturasFiltradas.map((factura, index) => (
                  <div key={index} className="factura-item">
                    <div className="factura-header">
                      <h3>Factura #{factura.numeroFactura}</h3>
                      <span className="factura-fecha">{formatearFecha(factura.fechaFactura)}</span>
                    </div>
                    
                    <div className="factura-details">
                      <p><strong>Empresa:</strong> {factura.nombreEmpresa}</p>
                      <p><strong>Dirección Empresa:</strong> {factura.direccionEmpresa}</p>
                      <p><strong>Cliente:</strong> {obtenerNombreCliente(factura.direccionCliente)}</p>
                      <p><strong>Dirección Cliente:</strong> {factura.direccionCliente}</p>
                      <p><strong>Importe Total:</strong> <span className="importe-total">{factura.importeTotal} ETH</span></p>
                    </div>
                    
                    <div className="factura-footer">
                      <span className="factura-status">✅ Pagada</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MisFacturas;
