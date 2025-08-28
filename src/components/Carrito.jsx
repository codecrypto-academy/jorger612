import React, { useState } from 'react';

function Carrito({ carrito, eliminarDelCarrito, mostrarCarrito, setMostrarCarrito }) {
  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + item.precioTotal, 0);
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
                  <button className="btn btn-comprar">
                    💳 Proceder al Pago
                  </button>
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
