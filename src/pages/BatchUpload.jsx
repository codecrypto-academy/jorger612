import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useForm } from 'react-hook-form'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import { Upload, FileText, Package, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react'

const BatchUpload = () => {
  const { account, getContract } = useWallet()
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedCodes, setUploadedCodes] = useState([])
  const [processedEvents, setProcessedEvents] = useState([])
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Por favor sube un archivo CSV válido')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target.result
        const lines = csv.split('\n')
        const codes = lines
          .slice(1) // Skip header
          .map(line => line.split(',')[0]) // Get first column
          .filter(code => code.trim() && code.length > 0) // Filter empty lines
        
        if (codes.length === 0) {
          toast.error('No se encontraron códigos válidos en el archivo')
          return
        }

        setUploadedCodes(codes)
        toast.success(`${codes.length} códigos cargados desde el archivo`)
      } catch (error) {
        console.error('Error parsing CSV:', error)
        toast.error('Error al procesar el archivo CSV')
      }
    }
    reader.readAsText(file)
  }

  const addBatchEvents = async (codes, eventType, coordinates = null) => {
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
      let successCount = 0
      const newEvents = []

      for (const code of codes) {
        try {
          // Crear el mensaje que debe ser firmado
          const timestamp = Math.floor(Date.now() / 1000)
          const messageHash = ethers.utils.solidityKeccak256(
            ["string", "uint256", "address"],
            [code, timestamp, account]
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
          const tx = await contract.addEvent(code, timestamp, fullSignature)
          await tx.wait()
          
          // Agregar el evento localmente
          const newEvent = {
            productCode: code,
            eventType,
            timestamp,
            organization: account,
            coordinates,
            txHash: tx.hash
          }
          newEvents.push(newEvent)
          successCount++
          
          // Pequeña pausa para evitar sobrecargar la red
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          console.error(`Error processing code ${code}:`, error)
          toast.error(`Error al procesar código ${code.slice(0, 8)}...`)
        }
      }

      setProcessedEvents(prev => [...prev, ...newEvents])
      toast.success(`${successCount} de ${codes.length} eventos registrados exitosamente`)
      return successCount
      
    } catch (error) {
      console.error('Error in batch processing:', error)
      toast.error('Error en el procesamiento por lotes')
      return 0
    } finally {
      setIsProcessing(false)
    }
    }

  const onSubmit = async (data) => {
    const { eventType, latitude, longitude } = data
    
    if (uploadedCodes.length === 0) {
      toast.error('No hay códigos cargados para procesar')
      return
    }
    
    let coordinates = null
    if (latitude && longitude) {
      coordinates = { lat: parseFloat(latitude), lng: parseFloat(longitude) }
    }
    
    const successCount = await addBatchEvents(uploadedCodes, eventType, coordinates)
    if (successCount > 0) {
      reset()
      setUploadedCodes([])
    }
  }

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Código,Descripción,Fecha\n"
      + "550e8400-e29b-41d4-a716-446655440000,Producto Ejemplo 1,2024-01-01\n"
      + "6ba7b810-9dad-11d1-80b4-00c04fd430c8,Producto Ejemplo 2,2024-01-01\n"
      + "6ba7b811-9dad-11d1-80b4-00c04fd430c8,Producto Ejemplo 3,2024-01-01"
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "product_codes_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Plantilla descargada')
  }

  const clearCodes = () => {
    setUploadedCodes([])
    toast.success('Códigos limpiados')
  }

  const eventTypes = [
    { value: 'BATCH_RECEIVED', label: 'Lote Recibido', color: 'text-green-600' },
    { value: 'BATCH_PROCESSED', label: 'Lote Procesado', color: 'text-blue-600' },
    { value: 'BATCH_SHIPPED', label: 'Lote Enviado', color: 'text-orange-600' },
    { value: 'BATCH_QUALITY_CHECK', label: 'Control de Calidad del Lote', color: 'text-purple-600' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Upload className="h-16 w-16 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Carga Masiva</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Procesa múltiples productos simultáneamente para mayor eficiencia. 
          Sube archivos CSV con códigos de productos y regístralos en lote.
        </p>
      </div>

      {/* Wallet Status */}
      {!account ? (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Conecta tu wallet para poder procesar lotes
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

      {/* File Upload */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Cargar Archivo CSV</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Archivo CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="input-field"
            />
            <p className="text-sm text-gray-500 mt-1">
              El archivo debe contener códigos de productos en la primera columna
            </p>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={downloadTemplate}
              className="btn-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </button>
            
            {uploadedCodes.length > 0 && (
              <button
                type="button"
                onClick={clearCodes}
                className="btn-secondary"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Códigos
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Codes Preview */}
      {uploadedCodes.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Códigos Cargados ({uploadedCodes.length})
          </h3>
          
          <div className="max-h-40 overflow-y-auto space-y-2">
            {uploadedCodes.map((code, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-mono text-sm">{code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Event Form */}
      {uploadedCodes.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Registrar Eventos en Lote</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <input
                  type="number"
                  step="any"
                  {...register('latitude')}
                  className="input-field"
                  placeholder="40.4168"
                />
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
                  <span>Procesando {uploadedCodes.length} productos...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Procesar Lote ({uploadedCodes.length} productos)</span>
                </div>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Processed Events */}
      {processedEvents.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Eventos Procesados</h2>
          
          <div className="space-y-4">
            {processedEvents.map((event, index) => (
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
                      <FileText className="h-4 w-4 text-gray-400" />
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
          
          <div className="mt-4 text-sm text-gray-600">
            Total procesados: {processedEvents.length}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Instrucciones de Carga Masiva</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <p>• <strong>Formato CSV:</strong> La primera columna debe contener los códigos UUID de los productos</p>
          <p>• <strong>Descarga la plantilla</strong> para ver el formato correcto del archivo</p>
          <p>• <strong>Procesamiento en lote:</strong> Todos los productos se registran con el mismo tipo de evento</p>
          <p>• <strong>Coordenadas opcionales:</strong> Se aplican a todos los productos del lote</p>
          <p>• <strong>Verificación:</strong> Cada producto se registra individualmente en la blockchain</p>
          <p>• <strong>Eficiencia:</strong> Ideal para organizaciones que reciben muchos productos simultáneamente</p>
        </div>
      </div>
    </div>
  )
}

export default BatchUpload
