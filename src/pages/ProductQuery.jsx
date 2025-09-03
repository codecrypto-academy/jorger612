import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Search, Package, MapPin, Calendar, User, ExternalLink, Copy, Filter, CheckCircle, AlertCircle } from 'lucide-react'

const ProductQuery = () => {
  const { account, getContract } = useWallet()
  const [searchCode, setSearchCode] = useState('')
  const [productData, setProductData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [filterType, setFilterType] = useState('all')

  // Simulación de datos de productos (en un caso real vendrían del contrato)
  const mockProducts = [
    {
      code: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Manzanas Gala',
      description: 'Manzanas frescas de temporada',
      producer: '0x1234...5678',
      timestamp: Date.now() - 86400000, // 1 día atrás
      events: [
        { type: 'PRODUCED', timestamp: Date.now() - 86400000, organization: '0x1234...5678' },
        { type: 'RECEIVED', timestamp: Date.now() - 43200000, organization: '0xabcd...efgh' },
        { type: 'STORED', timestamp: Date.now() - 21600000, organization: '0xabcd...efgh' }
      ],
      coordinates: { lat: 40.4168, lng: -3.7038 }
    },
    {
      code: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      name: 'Lechuga Romana',
      description: 'Lechuga orgánica fresca',
      producer: '0x1234...5678',
      timestamp: Date.now() - 172800000, // 2 días atrás
      events: [
        { type: 'PRODUCED', timestamp: Date.now() - 172800000, organization: '0x1234...5678' },
        { type: 'RECEIVED', timestamp: Date.now() - 129600000, organization: '0xabcd...efgh' }
      ],
      coordinates: { lat: 40.4168, lng: -3.7038 }
    },
    {
      code: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
      name: 'Tomates Cherry',
      description: 'Tomates cherry orgánicos',
      producer: '0x5678...9abc',
      timestamp: Date.now() - 259200000, // 3 días atrás
      events: [
        { type: 'PRODUCED', timestamp: Date.now() - 259200000, organization: '0x5678...9abc' },
        { type: 'RECEIVED', timestamp: Date.now() - 216000000, organization: '0xabcd...efgh' },
        { type: 'STORED', timestamp: Date.now() - 194400000, organization: '0xabcd...efgh' },
        { type: 'SHIPPED', timestamp: Date.now() - 172800000, organization: '0xabcd...efgh' }
      ],
      coordinates: { lat: 40.4168, lng: -3.7038 }
    }
  ]

  useEffect(() => {
    setAllProducts(mockProducts)
    loadAllProductsFromContract()
  }, [])

  const loadAllProductsFromContract = async () => {
    try {
      const contract = getContract()
      if (!contract) return

      // Nota: El contrato actual no tiene una función para listar todos los productos
      // Esto requeriría modificar el contrato para incluir un mapping de productos
      // Por ahora mantenemos los datos mock como fallback
      console.log('Contrato conectado, pero no hay función para listar todos los productos')
    } catch (error) {
      console.error('Error loading products from contract:', error)
    }
  }

  const searchProduct = async () => {
    if (!searchCode.trim()) {
      toast.error('Ingresa un código de producto')
      return
    }

    setIsLoading(true)
    try {
      const contract = getContract()
      if (!contract) {
        // Fallback a datos mock si no hay contrato
        const product = mockProducts.find(p => p.code.toLowerCase().includes(searchCode.toLowerCase()))
        if (product) {
          setProductData(product)
          toast.success('Producto encontrado (datos de ejemplo)')
        } else {
          setProductData(null)
          toast.error('Producto no encontrado')
        }
        return
      }

      // Consultar el contrato real
      const events = await contract.getEvents(searchCode)
      
      if (events && events.length > 0) {
        // Procesar los eventos del contrato
        const processedEvents = events.map((event, index) => {
          // Determinar el tipo de evento basado en el orden y la organización
          let eventType = 'EVENT'
          let eventDescription = 'Evento registrado en blockchain'
          
          if (index === 0) {
            eventType = 'PRODUCED'
            eventDescription = 'Producto producido y registrado inicialmente'
          } else if (index === 1) {
            eventType = 'RECEIVED'
            eventDescription = 'Producto recibido en almacén'
          } else if (index === 2) {
            eventType = 'STORED'
            eventDescription = 'Producto almacenado en instalaciones'
          } else if (index === 3) {
            eventType = 'SHIPPED'
            eventDescription = 'Producto enviado al siguiente eslabón'
          } else {
            eventType = 'QUALITY_CHECK'
            eventDescription = 'Control de calidad realizado'
          }

          return {
            type: eventType,
            description: eventDescription,
            timestamp: event.timestamp.toNumber(),
            organization: event.organization,
            signature: event.signature
          }
        })

        // Ordenar eventos por timestamp (más reciente primero)
        processedEvents.sort((a, b) => b.timestamp - a.timestamp)

        const productData = {
          code: searchCode,
          name: `Producto ${searchCode.slice(0, 8)}...`,
          description: 'Producto registrado en blockchain',
          producer: events[0].organization,
          timestamp: events[0].timestamp.toNumber(),
          events: processedEvents,
          coordinates: null // El contrato actual no almacena coordenadas
        }

        setProductData(productData)
        toast.success(`Producto encontrado en blockchain - ${events.length} evento(s)`)
      } else {
        setProductData(null)
        toast.error('Producto no encontrado en blockchain')
      }
    } catch (error) {
      console.error('Error searching product:', error)
      const errorMessage = error.message || error.reason || 'Error desconocido'
      toast.error(`Error al buscar el producto: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  const getEventTypeLabel = (type) => {
    const labels = {
      'PRODUCED': 'Producido',
      'RECEIVED': 'Recibido',
      'STORED': 'Almacenado',
      'SHIPPED': 'Enviado',
      'QUALITY_CHECK': 'Control de Calidad',
      'SOLD': 'Vendido',
      'EVENT': 'Evento Blockchain'
    }
    return labels[type] || type
  }

  const getEventDescription = (event, index) => {
    if (event.description) {
      return event.description
    }

    // Generar descripción basada en el tipo de evento
    const descriptions = {
      'PRODUCED': 'Producto producido y registrado inicialmente en la blockchain',
      'RECEIVED': 'Producto recibido en las instalaciones del almacén',
      'STORED': 'Producto almacenado y catalogado en el inventario',
      'SHIPPED': 'Producto enviado al siguiente eslabón de la cadena de suministro',
      'QUALITY_CHECK': 'Control de calidad realizado en el producto',
      'SOLD': 'Producto vendido al consumidor final',
      'EVENT': `Evento ${index + 1} registrado en la blockchain`
    }
    
    return descriptions[event.type] || `Evento ${index + 1} registrado en la blockchain`
  }

  const getTimeAgo = (timestamp) => {
    const now = Math.floor(Date.now() / 1000)
    const diff = now - timestamp
    
    if (diff < 60) return 'Hace menos de 1 minuto'
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} minuto(s)`
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} hora(s)`
    if (diff < 2592000) return `Hace ${Math.floor(diff / 86400)} día(s)`
    return `Hace ${Math.floor(diff / 2592000)} mes(es)`
  }

  const getEventTypeColor = (type) => {
    const colors = {
      'PRODUCED': 'bg-green-100 text-green-800',
      'RECEIVED': 'bg-blue-100 text-blue-800',
      'STORED': 'bg-purple-100 text-purple-800',
      'SHIPPED': 'bg-orange-100 text-orange-800',
      'QUALITY_CHECK': 'bg-yellow-100 text-yellow-800',
      'SOLD': 'bg-red-100 text-red-800',
      'EVENT': 'bg-indigo-100 text-indigo-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const filteredProducts = allProducts.filter(product => {
    if (filterType === 'all') return true
    return product.events.some(event => event.type === filterType)
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Search className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Consulta de Productos</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Busca y consulta la trazabilidad completa de cualquier producto registrado en la blockchain.
        </p>
      </div>

      {/* Contract Status */}
      {!account ? (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Conecta tu wallet para consultar productos en la blockchain
            </span>
          </div>
        </div>
      ) : (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">
              Conectado a blockchain - Contrato: {getContract() ? 'Conectado' : 'No disponible'}
            </span>
          </div>
        </div>
      )}

      {/* Search Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Buscar Producto</h2>
        
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="input-field"
              placeholder="Ingresa el código UUID del producto"
              onKeyPress={(e) => e.key === 'Enter' && searchProduct()}
            />
          </div>
          <button
            onClick={searchProduct}
            disabled={isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Product Details */}
      {productData && (
        <div className="card">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Detalles del Producto</h2>
            <button
              onClick={() => copyToClipboard(productData.code)}
              className="btn-secondary"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Código
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Información Básica</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <p className="font-medium">{productData.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Descripción:</span>
                  <p className="font-medium">{productData.description}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Código:</span>
                  <p className="font-mono text-sm">{productData.code}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Productor:</span>
                  <p className="font-mono text-sm">{productData.producer}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ubicación</h3>
              {productData.coordinates ? (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {productData.coordinates.lat.toFixed(4)}, {productData.coordinates.lng.toFixed(4)}
                  </span>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Ubicación no disponible</p>
              )}
            </div>
          </div>

          {/* Events Timeline */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Historial de Eventos</h3>
                         <div className="space-y-3">
               {productData.events.map((event, index) => (
                 <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                   <div className="flex items-start justify-between mb-2">
                     <div className={`px-3 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                       {getEventTypeLabel(event.type)}
                     </div>
                     <div className="text-xs text-gray-500">
                       #{index + 1}
                     </div>
                   </div>
                   
                   <div className="space-y-2">
                     <p className="text-sm font-medium text-gray-900">
                       {getEventDescription(event, index)}
                     </p>
                     
                     <div className="flex items-center space-x-2 text-sm text-gray-600">
                       <Calendar className="h-4 w-4" />
                       <span>{new Date(event.timestamp * 1000).toLocaleString('es-ES', {
                         year: 'numeric',
                         month: '2-digit',
                         day: '2-digit',
                         hour: '2-digit',
                         minute: '2-digit',
                         second: '2-digit'
                       })}</span>
                       <span className="text-gray-400">•</span>
                       <span className="text-gray-500 text-xs">{getTimeAgo(event.timestamp)}</span>
                     </div>
                     
                     <div className="flex items-center space-x-2 text-sm text-gray-500">
                       <User className="h-4 w-4" />
                       <span className="font-mono">{event.organization}</span>
                     </div>
                     
                     {event.signature && (
                       <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded font-mono">
                         Firma: {event.signature.slice(0, 20)}...{event.signature.slice(-20)}
                       </div>
                     )}
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* All Products Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Todos los Productos</h2>
          <div className="flex space-x-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-field"
            >
              <option value="all">Todos</option>
              <option value="PRODUCED">Producidos</option>
              <option value="RECEIVED">Recibidos</option>
              <option value="STORED">Almacenados</option>
              <option value="SHIPPED">Enviados</option>
              <option value="QUALITY_CHECK">Control de Calidad</option>
            </select>
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="btn-secondary"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showAllProducts ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        {showAllProducts && (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <div key={product.code} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Package className="h-5 w-5 text-gray-500" />
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <p className="font-mono text-xs text-gray-500 mb-2">{product.code}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Eventos: {product.events.length}</span>
                      <span>Último: {new Date(product.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSearchCode(product.code)
                      setProductData(product)
                    }}
                    className="btn-secondary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Information */}
      {account && (
        <div className="card bg-gray-50 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Debug</h3>
          <div className="space-y-2 text-gray-700 text-sm">
            <p><strong>Wallet:</strong> {account}</p>
            <p><strong>Contrato:</strong> 0x7561eaf103403953a05ED3e6d6023f1d0366e1B2</p>
            <p><strong>Estado del contrato:</strong> {getContract() ? 'Conectado' : 'No disponible'}</p>
            <p><strong>Red:</strong> {window.ethereum?.chainId ? `0x${parseInt(window.ethereum.chainId).toString(16)}` : 'No disponible'}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Instrucciones</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <p>• Ingresa el código UUID completo del producto que registraste</p>
          <p>• La búsqueda consulta directamente el contrato inteligente</p>
          <p>• Si no encuentras el producto, verifica que estés en la misma red que Remix</p>
          <p>• Cada evento incluye timestamp, organización y firma digital</p>
          <p>• Los eventos se muestran en orden cronológico</p>
        </div>
      </div>
    </div>
  )
}

export default ProductQuery
