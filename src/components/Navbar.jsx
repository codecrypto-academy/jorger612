import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { Package, Home, Factory, Warehouse, Truck, Store, Eye, Upload, Wallet, Search } from 'lucide-react'

const Navbar = () => {
  const { account, connectWallet, disconnectWallet, isConnecting } = useWallet()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Inicio', icon: Home },
    { path: '/producer', label: 'Productor', icon: Factory },
    { path: '/warehouse', label: 'Almacén', icon: Warehouse },
    { path: '/wholesaler', label: 'Mayorista', icon: Truck },
    { path: '/retailer', label: 'Minorista', icon: Store },
    { path: '/consumer', label: 'Consumidor', icon: Eye },
    { path: '/query', label: 'Consultar', icon: Search },
    { path: '/batch-upload', label: 'Carga Masiva', icon: Upload },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Product Tracker</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-sm text-gray-600">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
                <button
                  onClick={disconnectWallet}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Desconectar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <Wallet className="h-4 w-4" />
                <span>{isConnecting ? 'Conectando...' : 'Conectar Wallet'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
