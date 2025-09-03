import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Producer from './pages/Producer'
import Warehouse from './pages/Warehouse'
import Wholesaler from './pages/Wholesaler'
import Retailer from './pages/Retailer'
import Consumer from './pages/Consumer'
import BatchUpload from './pages/BatchUpload'
import ProductQuery from './pages/ProductQuery'
import { WalletProvider } from './contexts/WalletContext'

function App() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/producer" element={<Producer />} />
            <Route path="/warehouse" element={<Warehouse />} />
            <Route path="/wholesaler" element={<Wholesaler />} />
            <Route path="/retailer" element={<Retailer />} />
            <Route path="/consumer" element={<Consumer />} />
            <Route path="/batch-upload" element={<BatchUpload />} />
            <Route path="/query" element={<ProductQuery />} />
          </Routes>
        </main>
      </div>
    </WalletProvider>
  )
}

export default App
