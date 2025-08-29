import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI_TOKEN from '../ABI_TOKEN';

const CONTRACT_TOKEN_ADDRESS = '0xf3a330d667328f70EE26444f5519d457cdD36fdf';

function HistorialTokens({ provider, account }) {
  const [contractToken, setContractToken] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Inicializar contrato cuando se conecte la wallet
  useEffect(() => {
    if (provider && account) {
      const initContract = async () => {
        try {
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(CONTRACT_TOKEN_ADDRESS, ABI_TOKEN, signer);
          setContractToken(contractInstance);
          await cargarHistorial(contractInstance);
        } catch (error) {
          console.error('Error inicializando contrato:', error);
        }
      };
      initContract();
    }
  }, [provider, account]);

  // Cargar historial de transacciones
  const cargarHistorial = async (contractInstance = contractToken) => {
    if (!contractInstance) return;
    
    try {
      setLoading(true);
      
      // Obtener eventos de compra y retiro de tokens
      const filterCompra = contractInstance.filters.TokensPurchased(account);
      const filterRetiro = contractInstance.filters.TokensRedeemed(account);
      
      const eventosCompra = await contractInstance.queryFilter(filterCompra);
      const eventosRetiro = await contractInstance.queryFilter(filterRetiro);
      
      // Procesar eventos de compra
      const compras = eventosCompra.map(event => ({
        tipo: 'Compra',
        hash: event.transactionHash,
        bloque: event.blockNumber,
        timestamp: event.blockNumber, // Se puede obtener timestamp del bloque
        tokens: ethers.formatUnits(event.args.amount, 18),
        euros: ethers.formatUnits(event.args.eurosPaid, 18),
        direccion: event.args.buyer
      }));
      
      // Procesar eventos de retiro
      const retiros = eventosRetiro.map(event => ({
        tipo: 'Retiro',
        hash: event.transactionHash,
        bloque: event.blockNumber,
        timestamp: event.blockNumber, // Se puede obtener timestamp del bloque
        tokens: ethers.formatUnits(event.args.amount, 18),
        euros: ethers.formatUnits(event.args.eurosReceived, 18),
        direccion: event.args.seller
      }));
      
      // Combinar y ordenar por bloque
      const todasLasTransacciones = [...compras, ...retiros]
        .sort((a, b) => b.bloque - a.bloque);
      
      setTransacciones(todasLasTransacciones);
      
      if (todasLasTransacciones.length === 0) {
        setStatus({
          type: 'info',
          message: 'No tienes transacciones de tokens registradas aún.'
        });
      } else {
        setStatus({
          type: 'success',
          message: `Se encontraron ${todasLasTransacciones.length} transacción(es)`
        });
      }
      
    } catch (error) {
      console.error('Error cargando historial:', error);
      setStatus({
        type: 'error',
        message: 'Error cargando historial: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatear hash de transacción
  const formatearHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  // Obtener color según el tipo de transacción
  const getTipoColor = (tipo) => {
    return tipo === 'Compra' ? '#28a745' : '#dc3545';
  };

  // Obtener icono según el tipo de transacción
  const getTipoIcono = (tipo) => {
    return tipo === 'Compra' ? '💳' : '💸';
  };

  return (
    <div>
      <div className="card">
        <h2>📊 Historial de Tokens EURO</h2>
        <div className="info-message">
          💡 <strong>Visualiza todas tus transacciones de compra y retiro de tokens</strong>
        </div>
        
        <div className="historial-header">
          <button 
            className="btn btn-secondary"
            onClick={() => cargarHistorial()}
            disabled={loading}
          >
            🔄 Actualizar Historial
          </button>
        </div>

        {loading ? (
          <div className="loading">Cargando historial de transacciones...</div>
        ) : (
          <>
            {status.message && (
              <div className={`status ${status.type}`}>
                {status.message}
              </div>
            )}
            
            {transacciones.length === 0 ? (
              <div className="no-transacciones">
                <p>No se encontraron transacciones de tokens.</p>
              </div>
            ) : (
              <div className="transacciones-grid">
                {transacciones.map((tx, index) => (
                  <div key={index} className="transaccion-item">
                    <div className="transaccion-header">
                      <div className="transaccion-tipo" style={{ color: getTipoColor(tx.tipo) }}>
                        {getTipoIcono(tx.tipo)} {tx.tipo}
                      </div>
                      <div className="transaccion-bloque">
                        Bloque #{tx.bloque}
                      </div>
                    </div>
                    
                    <div className="transaccion-details">
                      <div className="detail-row">
                        <span className="detail-label">Tokens:</span>
                        <span className="detail-value">{tx.tokens} EURO</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Euros:</span>
                        <span className="detail-value">{tx.euros} EUR</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Hash:</span>
                        <span className="detail-value hash-value">
                          {formatearHash(tx.hash)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Dirección:</span>
                        <span className="detail-value address-value">
                          {formatearHash(tx.direccion)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="transaccion-footer">
                      <span className="transaccion-status">
                        {tx.tipo === 'Compra' ? '✅ Completada' : '✅ Completada'}
                      </span>
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

export default HistorialTokens;
