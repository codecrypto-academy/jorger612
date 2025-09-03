import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useForm } from 'react-hook-form'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Warehouse as WarehouseIcon, Package, ArrowRight, CheckCircle, AlertCircle, MapPin } from 'lucide-react'

const Warehouse = () => {
  const { account, getContract } = useWallet()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [events, setEvents] = useState([])
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm()

  const addProductEvent = async (productCode, eventType, coordinates = null) => {
    if (!account) {
      toast.error('Debes conectar tu wallet primero')
      return
    }

    const contract = getContract()
    if (!contract) {
      toast.error('Error al obtener el contrato')
      return
    }

    try {
      setIsProcessing(true)
      
      // Crear el mensaje que debe ser firmado
      const timestamp = Math.floor(Date.now() / 1000)
      const messageHash = ethers.utils.solidityKeccak256(
        ["string", "uint256", "address"],
        [productCode, timestamp, account]
      )
      
      // Firmar el mensaje
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [messageHash, account]
      })
      
      // Convertir la firma al formato correcto
      const formattedSignature = ethers.utils.splitSignature(signature)
      const fullSignature = ethers.utils.joinSignature(formattedSignature)
      
      // Agregar el evento al contrato
      const tx = await contract.addEvent(productCode, timestamp, fullSignature)
      await tx.wait()
      
      // Agregar el evento localmente
      const newEvent = {
        productCode,
        eventType,
        timestamp,
        organization: account,
        coordinates,
        txHash: tx.hash
      }
      setEvents(prev => [...prev, newEvent])
      
      toast.success(`Evento ${eventType} registrado para ${productCode.slice(0, 8)}...`)
      return true
      
    } catch (error) {
      console.error('Error adding product event:', error)
      toast.error('Error al registrar el evento en blockchain')
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  const onSubmit = async (data) => {
    const { productCode, eventType, latitude, longitude } = data
    
    let coordinates = null
    if (latitude && longitude) {
      coordinates = { lat: parseFloat(latitude), lng: parseFloat(longitude) }
    }
    
    const success = await addProductEvent(productCode, eventType, coordinates)
    if (success) {
      reset()
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true)
      
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords
          // Actualizar los campos del formulario con las coordenadas obtenidas
          setValue('latitude', latitude.toFixed(6))
          setValue('longitude', longitude.toFixed(6))
          toast.success(`Ubicación obtenida: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (precisión: ±${Math.round(accuracy)}m)`)
          setIsGettingLocation(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          let errorMessage = 'Error al obtener la ubicación'
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en tu navegador.'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Ubicación no disponible. Verifica que el GPS esté activado.'
              break
            case error.TIMEOUT:
              errorMessage = 'Tiempo de espera agotado. Intenta nuevamente.'
              break
          }
          toast.error(errorMessage)
          setIsGettingLocation(false)
        },
        options
      )
    } else {
      toast.error('Geolocalización no soportada por este navegador')
    }
  }

  const eventTypes = [
    { value: 'RECEIVED', label: 'Producto Recibido', color: 'text-green-600' },
    { value: 'STORED', label: 'Producto Almacenado', color: 'text-blue-600' },
    { value: 'SHIPPED', label: 'Producto Enviado', color: 'text-orange-600' },
    { value: 'QUALITY_CHECK', label: 'Control de Calidad', color: 'text-purple-600' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <WarehouseIcon className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Almacén</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Registra la recepción, almacenamiento y envío de productos. 
          Mantén un control completo del inventario con trazabilidad blockchain.
        </p>
      </div>

      {/* Wallet Status */}
      {!account ? (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Conecta tu wallet para poder registrar eventos
            </span>
          </div>
        </div>
      ) : (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800">
              Wallet conectada: {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>
        </div>
      )}

      {/* Event Registration Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Registrar Evento de Producto</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código del Producto *
            </label>
            <input
              type="text"
              {...register('productCode', { required: 'El código del producto es requerido' })}
              className="input-field"
              placeholder="Ingresa el código UUID del producto"
            />
            {errors.productCode && (
              <p className="text-red-600 text-sm mt-1">{errors.productCode.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Evento *
            </label>
            <select
              {...register('eventType', { required: 'El tipo de evento es requerido' })}
              className="input-field"
            >
              <option value="">Selecciona un tipo de evento</option>
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.eventType && (
              <p className="text-red-600 text-sm mt-1">{errors.eventType.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitud
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="any"
                  {...register('latitude')}
                  className="input-field"
                  placeholder="40.4168"
                />
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Obtener ubicación actual"
                >
                  {isGettingLocation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitud
              </label>
              <input
                type="number"
                step="any"
                {...register('longitude')}
                className="input-field"
                placeholder="-3.7038"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!account || isProcessing}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Registrar Evento</span>
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Eventos Recientes</h2>
          
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm text-gray-600">
                        {event.productCode.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{event.eventType}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(event.timestamp * 1000).toLocaleString()}
                    </div>
                    {event.coordinates && (
                      <div className="text-sm text-gray-500">
                        📍 {event.coordinates.lat.toFixed(4)}, {event.coordinates.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      TX: {event.txHash.slice(0, 6)}...{event.txHash.slice(-4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Instrucciones del Almacén</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <p>• <strong>Producto Recibido:</strong> Registra cuando llega un producto del productor</p>
          <p>• <strong>Producto Almacenado:</strong> Confirma que el producto está guardado en el almacén</p>
          <p>• <strong>Producto Enviado:</strong> Registra el envío al mayorista</p>
          <p>• <strong>Control de Calidad:</strong> Registra verificaciones de calidad realizadas</p>
          <p>• Las coordenadas geográficas son opcionales pero recomendadas para trazabilidad</p>
          <p>• Cada evento se registra en la blockchain con tu firma digital</p>
        </div>
      </div>
    </div>
  )
}

export default Warehouse
