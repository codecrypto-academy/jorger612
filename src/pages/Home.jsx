import React from 'react'
import { Link } from 'react-router-dom'
import { Package, Factory, Warehouse, Truck, Store, Eye, Upload, Shield, Globe, Clock } from 'lucide-react'

const Home = () => {
  const features = [
    {
      icon: Factory,
      title: 'Productor',
      description: 'Registra productos con códigos únicos y gestiona el inventario inicial',
      path: '/producer',
      color: 'text-blue-600'
    },
    {
      icon: Warehouse,
      title: 'Almacén',
      description: 'Registra la recepción y envío de productos con trazabilidad completa',
      path: '/warehouse',
      color: 'text-green-600'
    },
    {
      icon: Truck,
      title: 'Mayorista',
      description: 'Gestiona la distribución a gran escala con verificación de origen',
      path: '/wholesaler',
      color: 'text-orange-600'
    },
    {
      icon: Store,
      title: 'Minorista',
      description: 'Registra la llegada de productos y prepara para venta al consumidor',
      path: '/retailer',
      color: 'text-purple-600'
    },
    {
      icon: Eye,
      title: 'Consumidor',
      description: 'Consulta la trazabilidad completa de cualquier producto por código',
      path: '/consumer',
      color: 'text-red-600'
    },
    {
      icon: Upload,
      title: 'Carga Masiva',
      description: 'Procesa múltiples productos simultáneamente para mayor eficiencia',
      path: '/batch-upload',
      color: 'text-indigo-600'
    }
  ]

  const benefits = [
    {
      icon: Shield,
      title: 'Seguridad Blockchain',
      description: 'Todas las transacciones están firmadas criptográficamente y son inmutables'
    },
    {
      icon: Globe,
      title: 'Trazabilidad Global',
      description: 'Seguimiento completo del producto desde el productor hasta el consumidor'
    },
    {
      icon: Clock,
      title: 'Tiempo Real',
      description: 'Actualizaciones instantáneas en la cadena de suministro'
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Package className="h-20 w-20 text-primary-600" />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
          Product Tracker
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Sistema de trazabilidad blockchain para la cadena de suministro. 
          Rastrea cada producto desde su origen hasta el consumidor final con total transparencia y seguridad.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/consumer"
            className="btn-primary text-lg px-8 py-3"
          >
            Consultar Producto
          </Link>
          <Link
            to="/producer"
            className="btn-secondary text-lg px-8 py-3"
          >
            Registrar Producto
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Funcionalidades por Rol
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.path}
                to={feature.path}
                className="card hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="text-center space-y-4">
                  <div className={`mx-auto p-3 rounded-full bg-gray-100 group-hover:bg-primary-50 transition-colors duration-200`}>
                    <Icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Beneficios del Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="text-center space-y-4">
                <div className="mx-auto p-3 rounded-full bg-primary-100">
                  <Icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contract Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Información del Contrato</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Red:</strong> Sepolia Testnet</p>
          <p><strong>Contrato:</strong> ProductTracker</p>
          <p><strong>Dirección:</strong> 0x7561eaf103403953a05ED3e6d6023f1d0366e1B2</p>
          <p><strong>Explorer:</strong> 
            <a 
              href="https://sepolia.etherscan.io/address/0x7561eaf103403953a05ED3e6d6023f1d0366e1B2" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline ml-2"
            >
              Ver en Etherscan
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home
