import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Eye, Package, Search, MapPin, Clock, Building, CheckCircle, AlertTriangle } from 'lucide-react'

const Consumer = () => {
  const { getContractReadOnly } = useWallet()
  const [productCode, setProductCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [productEvents, setProductEvents] = useState([])
  const [productInfo, setProductInfo] = useState(null)

  const searchProduct = async () => {
    if (!productCode.trim()) {
      toast.error('Ingresa un código de producto')
      return
    }

    setIsSearching(true)
    try {
      const contract = getContractReadOnly()
      if (!contract) {
        toast.error('Error al conectar con la blockchain')
        return
      }

      // Obtener eventos del producto
      const events = await contract.getEvents(productCode)
      
      if (events.length === 0) {
        toast.error('No se encontraron eventos para este producto')
        setProductEvents([])
        setProductInfo(null)
        return
      }

      // Procesar eventos
      const processedEvents = events.map((event, index) => ({
        id: index,
        organization: event.organization,
        timestamp: event.timestamp.toNumber(),
        signature: event.signature,
        eventType: getEventType(index, events.length),
        location: getOrganizationLocation(event.organization),
        verified: verifySignature(event, productCode)
      }))

      setProductEvents(processedEvents)
      
      // Crear información del producto
      const firstEvent = processedEvents[0]
      const lastEvent = processedEvents[processedEvents.length - 1]
      
      setProductInfo({
        code: productCode,
        firstSeen: firstEvent.timestamp,
        lastSeen: lastEvent.timestamp,
        totalEvents: events.length,
        supplyChain: getSupplyChain(processedEvents)
      })

      toast.success(`Producto encontrado con ${events.length} eventos`)
      
    } catch (error) {
      console.error('Error searching product:', error)
      toast.error('Error al buscar el producto')
      setProductEvents([])
      setProductInfo(null)
    } finally {
      setIsSearching(false)
    }
  }

  const getEventType = (index, total) => {
    if (index === 0) return 'PRODUCIDO'
    if (index === total - 1) return 'DISPONIBLE'
    
    const types = ['EN ALMACÉN', 'ENVIADO', 'RECIBIDO', 'DISTRIBUIDO']
    return types[index % types.length] || 'EN PROCESO'
  }

  const getOrganizationLocation = (address) => {
    // Simulación de ubicaciones basadas en la dirección
    const locations = {
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': 'Madrid, España',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': 'Barcelona, España',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': 'Valencia, España',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906': 'Sevilla, España',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65': 'Bilbao, España'
    }
    
    return locations[address] || 'Ubicación no especificada'
  }

  const verifySignature = (event, productCode) => {
    try {
      // Verificar que la firma es válida
      const messageHash = ethers.utils.solidityKeccak256(
        ["string", "uint256", "address"],
        [productCode, event.timestamp, event.organization]
      )
      
      const ethSignedMessageHash = ethers.utils.solidityKeccak256(
        ["string", "bytes32"],
        ["\x19Ethereum Signed Message:\n32", messageHash]
      )
      
      const recoveredAddress = ethers.utils.recover(ethSignedMessageHash, event.signature)
      return recoveredAddress.toLowerCase() === event.organization.toLowerCase()
    } catch (error) {
      return false
    }
  }

  const getSupplyChain = (events) => {
    const organizations = events.map(event => ({
      address: event.organization,
      name: getOrganizationName(event.organization),
      location: event.location,
      timestamp: event.timestamp
    }))
    
    return organizations
  }

  const getOrganizationName = (address) => {
    const names = {
      '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': 'Productor Principal',
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': 'Almacén Central',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': 'Mayorista Regional',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906': 'Distribuidor Local',
      '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65': 'Minorista Final'
    }
    
    return names[address] || 'Organización'
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Eye className="h-16 w-16 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Consumidor</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Consulta la trazabilidad completa de cualquier producto usando su código único. 
          Descubre todo el recorrido desde el productor hasta tu manos.
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Buscar Producto</h2>
        
        <div className="flex space-x-4">
          <input
            type="text"
            value={productCode}
            onChange={(e) => setProductCode(e.target.value)}
            placeholder="Ingresa el código UUID del producto"
            className="input-field flex-1"
          />
          <button
            onClick={searchProduct}
            disabled={isSearching}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Buscando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Buscar</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Product Information */}
      {productInfo && (
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Información del Producto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Código:</strong> {productInfo.code}</p>
              <p><strong>Primera vez visto:</strong> {formatTimestamp(productInfo.firstSeen)}</p>
            </div>
            <div>
              <p><strong>Última actualización:</strong> {formatTimestamp(productInfo.lastSeen)}</p>
              <p><strong>Total de eventos:</strong> {productInfo.totalEvents}</p>
            </div>
          </div>
        </div>
      )}

      {/* Supply Chain Timeline */}
      {productEvents.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Cadena de Suministro</h2>
          
          <div className="space-y-6">
            {productEvents.map((event, index) => (
              <div key={event.id} className="relative">
                {/* Timeline connector */}
                {index < productEvents.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-12 bg-gray-300"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    event.verified ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {event.verified ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold text-gray-900">{event.eventType}</span>
                      {event.verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verificado
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4" />
                        <span>{getOrganizationName(event.organization)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimestamp(event.timestamp)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <button
                        onClick={() => copyToClipboard(event.organization)}
                        className="text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {event.organization.slice(0, 6)}...{event.organization.slice(-4)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-green-50 border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Cómo usar la Trazabilidad</h3>
        <div className="space-y-2 text-green-800 text-sm">
          <p>• <strong>Ingresa el código UUID</strong> del producto que quieres rastrear</p>
          <p>• <strong>Verifica la autenticidad</strong> de cada evento con las firmas digitales</p>
          <p>• <strong>Conoce el recorrido completo</strong> desde el productor hasta el minorista</p>
          <p>• <strong>Confirma la ubicación</strong> de cada paso en la cadena de suministro</p>
          <p>• <strong>Verifica fechas y tiempos</strong> de cada transacción</p>
        </div>
      </div>

      {/* Example Codes */}
      <div className="card bg-gray-50 border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Códigos de Ejemplo</h3>
        <p className="text-gray-600 text-sm mb-4">
          Si no tienes un código de producto, puedes usar uno de estos códigos de ejemplo para probar la funcionalidad:
        </p>
        <div className="space-y-2">
          {[
            '550e8400-e29b-41d4-a716-446655440000',
            '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            '6ba7b811-9dad-11d1-80b4-00c04fd430c8'
          ].map((code, index) => (
            <button
              key={index}
              onClick={() => setProductCode(code)}
              className="block w-full text-left p-2 bg-white rounded border hover:bg-gray-50 text-sm font-mono"
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Consumer
