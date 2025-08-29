import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ABI_FACTURA from '../ABI_FACTURA';
import ABI_TOKEN from '../ABI_TOKEN';

const CONTRACT_FACTURA_ADDRESS = '0xcbdA2B3fD6E2ce70ACfF3158F16503AC043dFA19';
const CONTRACT_TOKEN_ADDRESS = '0xf3a330d667328f70EE26444f5519d457cdD36fdf';

function Carrito({ carrito, eliminarDelCarrito, mostrarCarrito, setMostrarCarrito, provider, account }) {
  const [procesandoCompra, setProcesandoCompra] = useState(false);
  const [statusCompra, setStatusCompra] = useState({ type: '', message: '' });
  const [contractToken, setContractToken] = useState(null);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenPrice, setTokenPrice] = useState('0');

  // Inicializar contrato de tokens cuando se conecte la wallet
  useEffect(() => {
    if (provider && account) {
      const initTokenContract = async () => {
        try {
          const signer = await provider.getSigner();
          const tokenContract = new ethers.Contract(CONTRACT_TOKEN_ADDRESS, ABI_TOKEN, signer);
          setContractToken(tokenContract);
          await cargarDatosToken(tokenContract);
        } catch (error) {
          console.error('Error inicializando contrato de tokens:', error);
        }
      };
      initTokenContract();
    }
  }, [provider, account]);

  // Cargar datos del token
  const cargarDatosToken = async (contractInstance = contractToken) => {
    if (!contractInstance) return;
    
    try {
      // Obtener balance de tokens del usuario
      const balance = await contractInstance.balanceOf(account);
      setTokenBalance(ethers.formatUnits(balance, 18));
      
      // Obtener precio del token
      const price = await contractInstance.tokenPrice();
      setTokenPrice(ethers.formatUnits(price, 18));
      
    } catch (error) {
      console.error('Error cargando datos del token:', error);
    }
  };

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.precioTotal, 0);
  };

  // Calcular total en tokens EURO
  const calcularTotalEnTokens = () => {
    const totalETH = calcularTotal();
    if (parseFloat(tokenPrice) > 0) {
      return (totalETH / parseFloat(tokenPrice)).toFixed(6);
    }
    return '0';
  };

  // Verificar si tiene suficientes tokens
  const tieneSuficientesTokens = () => {
    const totalTokens = calcularTotalEnTokens();
    return parseFloat(tokenBalance) >= parseFloat(totalTokens);
  };

  // Función para procesar la compra y enviar factura a la blockchain
  const procesarCompra = async () => {
    if (!provider || !account) {
      setStatusCompra({
        type: 'error',
        message: 'Por favor conecta tu wallet primero'
      });
      return;
    }

    if (carrito.length === 0) {
      setStatusCompra({
        type: 'error',
        message: 'El carrito está vacío'
      });
      return;
    }

    if (!tieneSuficientesTokens()) {
      setStatusCompra({
        type: 'error',
        message: `No tienes suficientes tokens EURO. Necesitas ${calcularTotalEnTokens()} EURO, tienes ${tokenBalance} EURO`
      });
      return;
    }

    setProcesandoCompra(true);
    setStatusCompra({
      type: 'info',
      message: 'Procesando compra y enviando factura a la blockchain...'
    });

    try {
      const signer = await provider.getSigner();
      const contractFactura = new ethers.Contract(CONTRACT_FACTURA_ADDRESS, ABI_FACTURA, signer);

      // Obtener la fecha actual en formato string
      const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
      
      // Calcular el total en Wei (el contrato espera uint256)
      const totalEnWei = ethers.parseEther(calcularTotal().toString());

      // Obtener la dirección de la empresa del primer producto (asumiendo que todos son de la misma empresa)
      const direccionEmpresa = carrito[0].direccionEmpresa;

      // Llamar a la función agregarFactura del contrato
      const tx = await contractFactura.agregarFactura(
        direccionEmpresa,    // _dirEmpresa
        account,             // _dirCliente (la dirección de la wallet conectada)
        fechaActual,         // _feFactura
        totalEnWei           // _totFactura
      );

      setStatusCompra({
        type: 'info',
        message: 'Transacción enviada! Esperando confirmación en la blockchain...'
      });

      // Esperar a que se confirme la transacción
      const receipt = await tx.wait();

      setStatusCompra({
        type: 'success',
        message: `¡Compra exitosa! Factura enviada a la blockchain. Hash: ${receipt.hash.substring(0, 10)}...`
      });

      // Limpiar el carrito después de la compra exitosa
      setTimeout(() => {
        carrito.forEach((_, index) => eliminarDelCarrito(0)); // Eliminar todos los items
        setMostrarCarrito(false);
        setStatusCompra({ type: '', message: '' });
        // Recargar balance de tokens
        cargarDatosToken();
      }, 3000);

    } catch (error) {
      console.error('Error procesando la compra:', error);
      setStatusCompra({
        type: 'error',
        message: `Error procesando la compra: ${error.message}`
      });
    } finally {
      setProcesandoCompra(false);
    }
  };

  return (
    <>
      {/* Icono del carrito en la esquina superior derecha */}
      <div className="carrito-icono" onClick={() => setMostrarCarrito(!mostrarCarrito)}>
        🛒
        {carrito.length > 0 && (
          <span className="carrito-contador">{carrito.length}</span>
        )}
      </div>

      {/* Modal del carrito */}
      {mostrarCarrito && (
        <div className="carrito-modal-overlay" onClick={() => setMostrarCarrito(false)}>
          <div className="carrito-modal" onClick={(e) => e.stopPropagation()}>
            <div className="carrito-header">
              <h3>🛒 Carrito de Compras</h3>
              <button 
                className="cerrar-carrito"
                onClick={() => setMostrarCarrito(false)}
              >
                ✕
              </button>
            </div>

            {carrito.length === 0 ? (
              <div className="carrito-vacio">
                <p>Tu carrito está vacío</p>
                <span>Agrega productos para comenzar</span>
              </div>
            ) : (
              <>
                <div className="carrito-items">
                  {carrito.map((item, index) => (
                    <div key={index} className="carrito-item">
                      <div className="carrito-item-imagen">
                        {item.imagen ? (
                          <img src={item.imagen} alt={item.nombre} />
                        ) : (
                          <div className="placeholder-imagen">📦</div>
                        )}
                      </div>
                      <div className="carrito-item-info">
                        <h4>{item.nombre}</h4>
                        <p><strong>ID:</strong> {item.id}</p>
                        <p><strong>Empresa:</strong> {item.direccionEmpresa}</p>
                        <p><strong>Cantidad:</strong> {item.cantidad}</p>
                        <p><strong>Precio unitario:</strong> {item.precioUnitario} ETH</p>
                        <p><strong>Total:</strong> {item.precioTotal} ETH</p>
                      </div>
                      <button 
                        className="btn-eliminar"
                        onClick={() => eliminarDelCarrito(index)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="carrito-footer">
                  <div className="carrito-total">
                    <strong>Total del Carrito: {calcularTotal().toFixed(6)} ETH</strong>
                    <br />
                    <strong>Equivale a: {calcularTotalEnTokens()} tokens EURO</strong>
                  </div>
                  
                  {/* Información del balance de tokens */}
                  <div className="token-balance-info">
                    <p><strong>Tu balance de tokens EURO:</strong> {tokenBalance} EURO</p>
                    <p><strong>Precio del token:</strong> {tokenPrice} ETH</p>
                    {!tieneSuficientesTokens() && (
                      <p className="insufficient-tokens">
                        ⚠️ No tienes suficientes tokens EURO para esta compra
                      </p>
                    )}
                  </div>
                  
                  {/* Estado de la compra */}
                  {statusCompra.message && (
                    <div className={`status-compra ${statusCompra.type}`}>
                      {statusCompra.message}
                    </div>
                  )}
                  
                  <button 
                    className="btn btn-comprar"
                    onClick={procesarCompra}
                    disabled={procesandoCompra || !provider || !account || !tieneSuficientesTokens()}
                  >
                    {procesandoCompra ? '⏳ Procesando...' : '💳 Proceder al Pago'}
                  </button>
                  
                  {!provider || !account ? (
                    <p className="wallet-required">
                      ⚠️ Conecta tu wallet para poder realizar la compra
                    </p>
                  ) : !tieneSuficientesTokens() ? (
                    <p className="tokens-required">
                      💡 Necesitas más tokens EURO. Ve a la pestaña "Tokens EURO" para comprar más.
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Carrito;
