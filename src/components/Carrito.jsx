import React, { useState } from 'react';
import { ethers } from 'ethers';
import ABI_FACTURA from '../ABI_FACTURA';

const CONTRACT_FACTURA_ADDRESS = '0xcbdA2B3fD6E2ce70ACfF3158F16503AC043dFA19';

function Carrito({ carrito, eliminarDelCarrito, mostrarCarrito, setMostrarCarrito, provider, account }) {
  const [procesandoCompra, setProcesandoCompra] = useState(false);
  const [statusCompra, setStatusCompra] = useState({ type: '', message: '' });

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.precioTotal, 0);
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
                    disabled={procesandoCompra || !provider || !account}
                  >
                    {procesandoCompra ? '⏳ Procesando...' : '💳 Proceder al Pago'}
                  </button>
                  
                  {!provider || !account ? (
                    <p className="wallet-required">
                      ⚠️ Conecta tu wallet para poder realizar la compra
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
