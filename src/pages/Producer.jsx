import React, { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { useForm } from 'react-hook-form'
import { ethers } from 'ethers'
import { v4 as uuidv4 } from 'uuid'
import toast from 'react-hot-toast'
import { Factory, Package, Plus, CheckCircle, AlertCircle } from 'lucide-react'

const Producer = () => {
  const { account, getContract } = useWallet()
  const [isProcessing, setIsProcessing] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState([])
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const generateProductCode = () => {
    const code = uuidv4()
    setGeneratedCodes(prev => [...prev, code])
    return code
  }

  const generateMultipleCodes = (count) => {
    const codes = Array.from({ length: count }, () => uuidv4())
    setGeneratedCodes(prev => [...prev, ...codes])
    return codes
  }

  const addProductEvent = async (productCode) => {
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
      
      toast.success(`Producto ${productCode.slice(0, 8)}... registrado exitosamente`)
      return true
      
    } catch (error) {
      console.error('Error adding product event:', error)
      const errorMessage = error.message || error.reason || 'Error desconocido'
      toast.error(`Error al registrar el producto: ${errorMessage}`)
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  const onSubmit = async (data) => {
    if (!account) {
      toast.error('Debes conectar tu wallet primero')
      return
    }

    const { productName, productDescription, quantity } = data
    const quantityNum = parseInt(quantity)
    
    if (quantityNum === 1) {
      const code = generateProductCode()
      const success = await addProductEvent(code)
      if (success) {
        reset()
      }
    } else {
      const codes = generateMultipleCodes(quantityNum)
      let successCount = 0
      
      for (const code of codes) {
        const success = await addProductEvent(code)
        if (success) successCount++
      }
      
      toast.success(`${successCount} de ${quantityNum} productos registrados exitosamente`)
      reset()
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Código copiado al portapapeles')
  }

  const downloadCodes = () => {
    if (generatedCodes.length === 0) {
      toast.error('No hay códigos para descargar')
      return
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Código,Producto,Fecha Generación\n"
      + generatedCodes.map(code => `${code},Producto,${new Date().toISOString()}`).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "product_codes.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Códigos descargados exitosamente')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Factory className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Productor</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Registra productos con códigos únicos y gestiona el inventario inicial. 
          Cada producto será rastreado a lo largo de toda la cadena de suministro.
        </p>
      </div>

      {/* Wallet Status */}
      {!account ? (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Conecta tu wallet para poder registrar productos
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

      {/* Product Registration Form */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Registrar Producto</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto
              </label>
              <input
                type="text"
                {...register('productName', { required: 'El nombre es requerido' })}
                className="input-field"
                placeholder="Ej: Manzanas Gala"
              />
              {errors.productName && (
                <p className="text-red-600 text-sm mt-1">{errors.productName.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                {...register('productDescription')}
                className="input-field"
                placeholder="Ej: Manzanas frescas de temporada"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              {...register('quantity', { 
                required: 'La cantidad es requerida',
                min: { value: 1, message: 'La cantidad debe ser al menos 1' },
                max: { value: 100, message: 'La cantidad máxima es 100' }
              })}
              className="input-field"
              placeholder="1"
              min="1"
              max="100"
            />
            {errors.quantity && (
              <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
            )}
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
                <Plus className="h-4 w-4" />
                <span>Registrar Producto</span>
              </div>
            )}
          </button>
        </form>
      </div>

      {/* Generated Codes */}
      {generatedCodes.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Códigos Generados</h2>
            <button
              onClick={downloadCodes}
              className="btn-secondary"
            >
              Descargar CSV
            </button>
          </div>
          
          <div className="space-y-3">
            {generatedCodes.map((code, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-gray-500" />
                  <span className="font-mono text-sm">{code}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(code)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Copiar
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 mt-4">
            Total: {generatedCodes.length} código(s) generado(s)
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Instrucciones</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <p>• Cada producto recibe un código único (UUID) generado automáticamente</p>
          <p>• Los códigos se registran en la blockchain con tu firma digital</p>
          <p>• Puedes generar códigos individuales o en lotes</p>
          <p>• Descarga los códigos en formato CSV para uso posterior</p>
          <p>• Los códigos serán utilizados por otros actores de la cadena de suministro</p>
        </div>
      </div>
    </div>
  )
}

export default Producer
