import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import ABI_PRODUCTOS from '../ABI_PRODUCTOS.js';
import ABI_EMPRESA from '../ABI_EMPRESA.js';

const CONTRACT_ADDRESS = '0xdEA36F21D377C99c9b36AA306fb58726fA0693C1';
const CONTRACT_EMPRESA_ADDRESS = '0x73Ae10E84468c30e564A02d6e18068D10854A333';

// Pinata IPFS Configuration
const PINATA_API_KEY = '71a164c7ab05f08ee6cd';
const PINATA_SECRET_KEY = 'e7a0d6d386755bb582d3d60a5c2e1102eaf01e25371e6c559b2d2ec312e8af8c';
const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

// Función para probar acceso a imagen IPFS
const testImageAccess = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    console.log(`Test de acceso a imagen: ${imageUrl} - Status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`Error probando acceso a imagen: ${imageUrl}`, error);
    return false;
  }
};

// Función para subir imagen a Pinata IPFS
const uploadToPinata = async (file) => {
  try {
    console.log('Subiendo imagen a Pinata IPFS...', file.name);
    
    // Crear FormData para Pinata
    const formData = new FormData();
    formData.append('file', file);
    
    // Configurar headers para Pinata
    const headers = {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY
    };
    
    // Subir a Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error de Pinata:', response.status, errorText);
      throw new Error(`Error de Pinata: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Imagen subida a Pinata exitosamente:', result);
    
    if (!result.IpfsHash) {
      throw new Error('Pinata no retornó un CID válido');
    }
    
    return result.IpfsHash; // Retorna el CID
  } catch (error) {
    console.error('Error subiendo a Pinata:', error);
    throw new Error(`Error subiendo a Pinata: ${error.message}`);
  }
};

function Productos({ provider, account }) {
  const [contract, setContract] = useState(null);
  const [productoNombre, setProductoNombre] = useState('');
  const [productoPrecio, setProductoPrecio] = useState('');
  const [productoImagen, setProductoImagen] = useState('');
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState('');
  const [productos, setProductos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  // Cargar empresas para el dropdown
  const cargarEmpresas = useCallback(async () => {
    try {
      console.log('Intentando cargar empresas...');
      if (provider) {
        console.log('Provider disponible, creando contrato empresa...');
        // Crear contrato de empresas usando provider (no signer) para llamadas de solo lectura
        const empresaContract = new ethers.Contract(
          CONTRACT_EMPRESA_ADDRESS,
          ABI_EMPRESA,
          provider
        );
        
        console.log('Contrato empresa creado, consultando...');
        const empresasData = await empresaContract.consultarTodasLasEmpresas();
        console.log('Datos de empresas recibidos:', empresasData);
        
        // Los datos vienen en arrays separados: [direcciones, nombres]
        const [direcciones, nombres] = empresasData;
        const empresasList = direcciones.map((direccion, index) => ({
          direccion: direccion,
          nombre: nombres[index]
        }));
        
        console.log('Lista de empresas procesada:', empresasList);
        setEmpresas(empresasList);
      } else {
        console.log('Provider no disponible aún');
      }
    } catch (error) {
      console.error('Error cargando empresas:', error);
      setStatus({
        type: 'error',
        message: 'Error cargando empresas: ' + error.message
      });
    }
  }, [provider]);

  // Cargar productos
  const cargarProductos = useCallback(async () => {
    try {
      if (provider) {
        setLoading(true);
        console.log('Cargando productos usando provider...');
        
        // Crear contrato de productos usando provider (no signer) para llamadas de solo lectura
        const productosContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          ABI_PRODUCTOS,
          provider
        );
        
        const productosData = await productosContract.consultarTodosLosProductos();
        console.log('Datos de productos recibidos:', productosData);
        
        // Los datos vienen en arrays separados, los combinamos
        const productosList = [];
        for (let i = 0; i < productosData[0].length; i++) {
          const cid = productosData[4][i]; // pathImagen es el CID
          console.log(`Producto ${i}: CID =`, cid, 'Tipo:', typeof cid);
          
          const imagenUrl = cid ? `${PINATA_GATEWAY}${cid}` : null;
          console.log(`Producto ${i}: URL de imagen =`, imagenUrl);
          
          productosList.push({
            id: productosData[0][i].toString(),
            direccionEmpresa: productosData[1][i],
            nombre: productosData[2][i],
            precio: ethers.formatEther(productosData[3][i]),
            imagen: imagenUrl,
            cid: cid
          });
        }
        
        console.log('Lista de productos procesada:', productosList);
        setProductos(productosList);
        setStatus({
          type: 'success',
          message: `${productosList.length} productos cargados exitosamente`
        });
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setStatus({
        type: 'error',
        message: 'Error cargando productos: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  }, [provider]);

  // Inicializar contrato de productos con signer para transacciones
  useEffect(() => {
    console.log('Provider cambió:', provider);
    if (provider) {
      console.log('Inicializando contrato de productos con signer...');
      const initContract = async () => {
        try {
          const signer = await provider.getSigner();
          const productosContract = new ethers.Contract(CONTRACT_ADDRESS, ABI_PRODUCTOS, signer);
          setContract(productosContract);
          console.log('Contrato de productos creado con signer');
        } catch (error) {
          console.error('Error inicializando contrato de productos:', error);
        }
      };
      initContract();
    }
  }, [provider]);

  // Cargar empresas cuando el provider esté disponible
  useEffect(() => {
    if (provider) {
      cargarEmpresas();
    }
  }, [provider, cargarEmpresas]);

  // Cargar productos cuando el provider esté disponible
  useEffect(() => {
    if (provider) {
      cargarProductos();
    }
  }, [provider, cargarProductos]);

  // Agregar producto
  const agregarProducto = async (e) => {
    e.preventDefault();
    
    if (!empresaSeleccionada) {
      setStatus({
        type: 'error',
        message: 'Por favor selecciona una empresa'
      });
      return;
    }

    if (!productoNombre || !productoPrecio || !productoImagen) {
      setStatus({
        type: 'error',
        message: 'Por favor completa todos los campos'
      });
      return;
    }

    try {
      setLoading(true);
      setStatus({
        type: 'info',
        message: 'Subiendo imagen a Pinata IPFS...'
      });

      // Subir imagen a Pinata IPFS
      const cid = await uploadToPinata(productoImagen);
      
      setStatus({
        type: 'info',
        message: 'Imagen subida a IPFS. Agregando producto a la blockchain...'
      });

      const precioWei = ethers.parseEther(productoPrecio);
      
      const tx = await contract.agregarProducto(
        empresaSeleccionada,
        productoNombre,
        precioWei,
        cid // Enviamos el CID en lugar del nombre del archivo
      );
      
      await tx.wait();
      
      setStatus({
        type: 'success',
        message: 'Producto agregado exitosamente! Imagen disponible en IPFS.'
      });
      
      // Limpiar formulario
      setProductoNombre('');
      setProductoPrecio('');
      setProductoImagen('');
      setEmpresaSeleccionada('');
      
      // Recargar productos
      cargarProductos();
      
    } catch (error) {
      console.error('Error agregando producto:', error);
      setStatus({
        type: 'error',
        message: 'Error agregando producto: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductoImagen(file); // Almacenar el objeto File completo
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>📦 Agregar Producto</h2>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={cargarEmpresas}
            disabled={!provider}
          >
            🔄 Cargar Empresas
          </button>
        </div>
        <form onSubmit={agregarProducto}>
          <div className="form-group">
            <label htmlFor="empresa">Empresa:</label>
            <select
              id="empresa"
              value={empresaSeleccionada}
              onChange={(e) => setEmpresaSeleccionada(e.target.value)}
              required
            >
              <option value="">Selecciona una empresa</option>
              {empresas.length === 0 ? (
                <option value="" disabled>No hay empresas disponibles</option>
              ) : (
                empresas.map((empresa, index) => (
                  <option key={index} value={empresa.direccion}>
                    {empresa.nombre} ({empresa.direccion})
                  </option>
                ))
              )}
            </select>
            {empresas.length === 0 && (
              <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
                No hay empresas disponibles. Asegúrate de tener empresas registradas en la pestaña "Empresas".
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="nombre">Nombre del Producto:</label>
            <input
              type="text"
              id="nombre"
              value={productoNombre}
              onChange={(e) => setProductoNombre(e.target.value)}
              placeholder="Ingresa el nombre del producto"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="precio">Precio (ETH):</label>
            <input
              type="number"
              id="precio"
              value={productoPrecio}
              onChange={(e) => setProductoPrecio(e.target.value)}
              placeholder="0.01"
              step="0.001"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="imagen">Imagen del Producto:</label>
            <input
              type="file"
              id="imagen"
              onChange={handleImageChange}
              accept="image/*"
              required
            />
                         {productoImagen && (
               <p className="file-info">
                 Archivo seleccionado: {productoImagen.name}
                 <br />
                 <small style={{ color: '#6c757d' }}>
                   Este archivo se subirá a Pinata IPFS y el CID se guardará en la blockchain
                 </small>
               </p>
             )}
          </div>

          <button 
            type="submit" 
            className="btn" 
            disabled={loading}
          >
            {loading ? '⏳ Procesando...' : '➕ Agregar Producto'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>📋 Lista de Productos</h2>
          <button 
            className="btn btn-secondary" 
            onClick={cargarProductos}
            disabled={loading}
            style={{ marginRight: '10px' }}
          >
            🔄 Actualizar
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={async () => {
              if (productos.length > 0) {
                console.log('Probando acceso a todas las imágenes...');
                for (const producto of productos) {
                  if (producto.imagen) {
                    await testImageAccess(producto.imagen);
                  }
                }
              }
            }}
            disabled={loading || productos.length === 0}
            style={{ marginRight: '10px' }}
          >
            🧪 Probar Imágenes
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              console.log('Estado actual de productos:', productos);
              console.log('Forzando re-renderizado...');
              setProductos([...productos]); // Forzar re-renderizado
            }}
            disabled={loading || productos.length === 0}
          >
            🔍 Debug Productos
          </button>
        </div>

                 {/* Debug info */}
         <div style={{ marginBottom: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '8px', fontSize: '14px' }}>
           <p><strong>Debug Info:</strong></p>
           <p>Provider: {provider ? '✅ Disponible' : '❌ No disponible'}</p>
           <p>Contrato Productos (Signer): {contract ? '✅ Disponible' : '❌ No disponible'}</p>
           <p>Pinata IPFS: ✅ Configurado</p>
           <p>Pinata Gateway: {PINATA_GATEWAY}</p>
           <p>Empresas cargadas: {empresas.length}</p>
           <p>Productos cargados: {productos.length}</p>
           {productos.length > 0 && (
             <div style={{ marginTop: '10px', padding: '10px', background: '#e9ecef', borderRadius: '5px' }}>
               <p><strong>Detalles de Productos:</strong></p>
               {productos.map((producto, index) => (
                 <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>
                   <strong>{producto.nombre}:</strong> 
                   <br />
                   • CID: {producto.cid || 'N/A'}
                   <br />
                   • URL: {producto.imagen || 'N/A'}
                   <br />
                   • Tiene Imagen: {producto.imagen ? '✅ Sí' : '❌ No'}
                   <br />
                   • Tipo CID: {typeof producto.cid}
                   <br />
                   <hr style={{ margin: '5px 0', border: 'none', borderTop: '1px solid #ccc' }} />
                 </div>
               ))}
             </div>
           )}
         </div>

        {loading ? (
          <p>Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p>No hay productos registrados</p>
        ) : (
          <div className="productos-grid">
            {productos.map((producto) => {
              console.log(`Renderizando producto: ${producto.nombre}`, {
                imagen: producto.imagen,
                cid: producto.cid,
                tieneImagen: !!producto.imagen
              });
              
              return (
                <div key={producto.id} className="producto-card">
                  <div className="producto-imagen">
                    {producto.imagen ? (
                      <img 
                        src={producto.imagen} 
                        alt={producto.nombre}
                        onLoad={() => console.log(`✅ Imagen cargada exitosamente: ${producto.imagen}`)}
                        onError={(e) => {
                          console.error(`❌ Error cargando imagen: ${producto.imagen}`, e);
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEMUQ1REIiLz4KPHBhdGggZD0iTTM1IDM1VjY1SDY1VjM1SDM1WiIgZmlsbD0iI0E5Q0JGIi8+Cjwvc3ZnPgo=';
                        }}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          border: '2px solid #e1e5e9'
                        }}
                      />
                    ) : (
                      <div className="placeholder-imagen">
                        📦
                        <br />
                        <small style={{ fontSize: '12px', color: '#999' }}>
                          Sin imagen
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="producto-info">
                    <h3>{producto.nombre}</h3>
                    <p><strong>Precio:</strong> {producto.precio} ETH</p>
                    <p><strong>Empresa:</strong> {producto.direccionEmpresa}</p>
                    <p><strong>ID:</strong> {producto.id}</p>
                    {producto.cid && (
                      <p><strong>IPFS CID:</strong> <code style={{ fontSize: '12px', background: '#f8f9fa', padding: '2px 4px', borderRadius: '3px' }}>{producto.cid}</code></p>
                    )}
                    <p><strong>URL Imagen:</strong> <code style={{ fontSize: '10px', background: '#f8f9fa', padding: '2px 4px', borderRadius: '3px', wordBreak: 'break-all' }}>{producto.imagen || 'N/A'}</code></p>
                  </div>
                </div>
              );
            })}
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

export default Productos;
